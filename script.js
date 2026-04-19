const inputBox = document.getElementById("input-box");
const listContainer = document.getElementById("list-container");
const completedCounter = document.getElementById("completed-counter");
const uncompletedCounter = document.getElementById("uncompleted-counter");
const taskTitle = document.getElementById("task-title");
const allCompleteMessage = document.getElementById("all-complete-message");


function saveTasks() {
    const tasks = [];
    document.querySelectorAll("#list-container li").forEach(li => {
        tasks.push({
            text:li.querySelector(".task-text").textContent, 
            completed: li.classList.contains("completed"),
            important: li.classList.contains("important"),
            subtasks: li.dataset.subtasks ? JSON.parse(li.dataset.subtasks) : [],
            dueDate: li.dataset.dueDate || null
        });
    });
    localStorage.setItem("tasks", JSON.stringify(tasks));
}

function loadTasks() {
    const saved = localStorage.getItem("tasks");
    if (!saved) return;
    JSON.parse(saved).forEach(task => {
        addTask(task.text, task.completed, task.important, task.subtasks || [], task.dueDate || null);
    });
}

inputBox.addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
        addTask();
    }
});

function addTask(savedText = null, savedCompleted = false, savedImportant = false, savedSubtasks = [], savedDueDate = null) {
    const task = savedText || inputBox.value.trim();
    if (!task) {
        alert("Please write down a task");
        return;
    }

    const dueDate = savedDueDate || document.getElementById("due-date").value || null;

    const li = document.createElement("li");
    li.innerHTML = `
    <div class="task-left">
        <span class="star-btn" title="Star task">☆</span>
        <span class="subtask-btn" title="Add Subtasks">+</span>
        <label>
            <input type="checkbox">
            <span class="task-text">${task}</span>
        </label>
    </div>
    <div class="task-buttons">
        <span class="edit-btn">Edit</span>
        <span class="delete-btn">Delete</span>
    </div>
    `;

    if (dueDate) li.dataset.dueDate = dueDate;

    const checkbox = li.querySelector("input");
    const editBtn = li.querySelector(".edit-btn");
    const taskSpan = li.querySelector(".task-text");
    const deleteBtn = li.querySelector(".delete-btn");
    const starBtn = li.querySelector(".star-btn");

    starBtn.addEventListener("click", function() {
        li.classList.toggle("important");
        starBtn.textContent = li.classList.contains("important") ? "★" : "☆";
        saveTasks();
    });

    const subtaskBtn = li.querySelector(".subtask-btn");
    subtaskBtn.addEventListener("click", function() {
        openSubtasks(li);
    });

    checkbox.checked = savedCompleted;
    if (savedCompleted) li.classList.add("completed");
    if (savedImportant) { li.classList.add("important"); starBtn.textContent = "★"; }

    checkbox.addEventListener("click", function() {
        li.classList.toggle("completed", checkbox.checked);
        updateCounters();
        saveTasks();
        updateDeadlinePanel();
    });

    editBtn.addEventListener("click", function() {
        const currentText = taskSpan.textContent;
        const currentDate = li.dataset.dueDate || "";
        
        taskSpan.innerHTML = `
            <input type="text" class="inline-edit-input" value="${currentText}">
            <input type="date" class="inline-edit-date" value="${currentDate}">
        `;
        
        const editInput = taskSpan.querySelector(".inline-edit-input");
        const dateInput = taskSpan.querySelector(".inline-edit-date");
        editInput.focus();

        let saved = false;

        function saveEdit() {
            if (saved) return;
            saved = true;

            const newText = editInput.value.trim();
            const newDate = dateInput.value;

            taskSpan.textContent = newText !== "" ? newText : currentText;

            if (newDate) {
                li.dataset.dueDate = newDate;
            } else {
                delete li.dataset.dueDate;
            }

            if (li.classList.contains("completed")) {
                li.classList.remove("completed");
                checkbox.checked = false;
            }

            updateCounters();
            saveTasks();
            updateDeadlinePanel();
        }
        editInput.addEventListener("blur", function() {
            setTimeout(() => {
                if (!taskSpan.contains(document.activeElement)) saveEdit();
            }, 200);
        });

        dateInput.addEventListener("blur", function() {
            setTimeout(() => {
                if (!taskSpan.contains(document.activeElement)) saveEdit();
            }, 200);
        });
        
        editInput.addEventListener("keypress", function(e) {
            if (e.key === "Enter") saveEdit();
        });

        dateInput.addEventListener("keypress", function(e) {
            if (e.key === "Enter") saveEdit();
        });

        editInput.addEventListener("blur", function() {
            setTimeout(() => {
                if (!taskSpan.contains(document.activeElement)) saveEdit();
            }, 200);
        });

        dateInput.addEventListener("blur", function() {
            setTimeout(() => {
                if (!taskSpan.contains(document.activeElement)) saveEdit();
            }, 200);
        });
    }); // ← editBtn closes here properly

    deleteBtn.addEventListener("click", function() {
        if (confirm("Are you sure you want to delete this task?")) {
            li.remove();
            updateCounters();
            saveTasks();
            updateDeadlinePanel();
        }
    });

    if (savedSubtasks.length > 0) li.dataset.subtasks = JSON.stringify(savedSubtasks);

    listContainer.appendChild(li);
    inputBox.value = "";
    document.getElementById("due-date").value = "";
    updateCounters();
    saveTasks();
    updateDeadlinePanel();
}

function updateCounters() {
    const totalTasks = document.querySelectorAll("#list-container li").length;
    const completedTasks = document.querySelectorAll("#list-container li.completed").length;
    const uncompletedTasks = totalTasks - completedTasks;

    completedCounter.textContent = completedTasks;
    uncompletedCounter.textContent = uncompletedTasks;

    if (totalTasks > 0 && completedTasks === totalTasks) {
        allCompleteMessage.style.display = "block";
    } else {
        allCompleteMessage.style.display = "none";
    }
}

function resetTasks() {
    if (confirm("Are you sure you want to clear all tasks?")) {
        listContainer.innerHTML = "";
        localStorage.clear();
        updateCounters();
    }
}
loadTasks();

function toggleChat() {
    const chatWindow = document.getElementById("chat-window");
    chatWindow.style.display = chatWindow.style.display === "none" ? "block" : "none";
}

async function sendMessage() {
    const input = document.getElementById("chat-input");
    const messages = document.getElementById("chat-messages");
    const message = input.value.trim();
    if (!message) return;

    const tasks = [];
    document.querySelectorAll("#list-container li").forEach(li => {
        const subtasks = li.dataset.subtasks ? JSON.parse(li.dataset.subtasks) : [];
        tasks.push({
            text: li.querySelector(".task-text").textContent,
            completed: li.classList.contains("completed"),
            important: li.classList.contains("important"),
            dueDate: li.dataset.dueDate || null,
            subtasks: subtasks
        });
    });

    const fullMessage = `
You are a helpful to-do list assistant. Here are the user's current tasks:
${tasks.map(t => {
    let taskLine = `- ${t.text} (completed: ${t.completed}, starred: ${t.important}, due: ${t.dueDate || "no deadline"})`;
    if (t.subtasks.length > 0) {
        taskLine += `\n  Subtasks:\n` + t.subtasks.map(s => `    • ${s.text} (completed: ${s.completed})`).join("\n");
    }
    return taskLine;
}).join("\n")}

User message: ${message}`;

    messages.innerHTML += `<div class="user-message">${message}</div>`;
    input.value = "";

    const typingDiv = document.createElement("div");
    typingDiv.className = "ai-message";
    typingDiv.textContent = "Typing...";
    messages.appendChild(typingDiv);
    messages.scrollTop = messages.scrollHeight;

    const response = await fetch("http://localhost:3000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: fullMessage })
    });

    const data = await response.json();
    typingDiv.innerHTML = formatMessage(data.reply);
    messages.scrollTop = messages.scrollHeight;
}

function formatMessage(text) {
    return text
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/\n/g, "<br>")
        .replace(/^\d+\.\s/gm, "<br>• ");
}

let activeTask = null;

function openSubtasks(li) {
    activeTask = li;
    const taskName = li.querySelector(".task-text").textContent;
    document.getElementById("subtask-title").textContent = `Subtasks: ${taskName}`;
    
    const subtaskList = document.getElementById("subtask-list");
    subtaskList.innerHTML = "";
    
    const saved = li.dataset.subtasks ? JSON.parse(li.dataset.subtasks) : [];
    saved.forEach(subtask => {
        addSubtaskToList(subtask.text, subtask.completed);
    });
    
    document.getElementById("subtask-panel").style.display = "flex";
    document.getElementById("subtask-input").addEventListener("keypress", function(event) {
        if (event.key === "Enter") {
            addSubtask();
        }
    });
}

function closeSubtasks() {
    document.getElementById("subtask-panel").style.display = "none";
    activeTask = null;
}

function addSubtask() {
    const input = document.getElementById("subtask-input");
    const text = input.value.trim();
    if (!text) return;
    
    addSubtaskToList(text, false);
    input.value = "";
    saveSubtasks();
}

document.getElementById("subtask-input").addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
        addSubtask();
    }
});

function addSubtaskToList(text, completed) {
    const subtaskList = document.getElementById("subtask-list");
    const li = document.createElement("li");
    
    if (completed) li.classList.add("subtask-completed");
    
    li.innerHTML = `
    <label>
        <input type="checkbox" ${completed ? "checked" : ""}>
        <span>${text}</span>
    </label>
    <button class="subtask-delete">🗑</button>
    `;
    
    const checkbox = li.querySelector("input");
    checkbox.addEventListener("click", function() {
        li.classList.toggle("subtask-completed", checkbox.checked);
        li.querySelector("label span").style.textDecoration = checkbox.checked ? "line-through" : "none";
        li.querySelector("label span").style.color = checkbox.checked ? "#a1a1aa" : "white";
        saveSubtasks();
    });
    
    li.querySelector(".subtask-delete").addEventListener("click", function() {
        li.remove();
        saveSubtasks();
    });
    
    subtaskList.appendChild(li);
}

function saveSubtasks() {
    if (!activeTask) return;
    const subtasks = [];
    document.querySelectorAll("#subtask-list li").forEach(li => {
        subtasks.push({
            text: li.querySelector("label span").textContent,
            completed: li.classList.contains("subtask-completed")
        });
    });
    activeTask.dataset.subtasks = JSON.stringify(subtasks);
    saveTasks();
}

const subtaskPanel = document.getElementById("subtask-panel");
const subtaskHeader = document.getElementById("subtask-header");

let isDragging = false;
let offsetX, offsetY;

subtaskHeader.addEventListener("mousedown", function(e) {
    isDragging = true;
    offsetX = e.clientX - subtaskPanel.getBoundingClientRect().left;
    offsetY = e.clientY - subtaskPanel.getBoundingClientRect().top;
    subtaskHeader.style.cursor = "grabbing";
});

document.addEventListener("mousemove", function(e) {
    if (!isDragging) return;
    subtaskPanel.style.left = (e.clientX - offsetX) + "px";
    subtaskPanel.style.top = (e.clientY - offsetY) + "px";
    subtaskPanel.style.transform = "none";
});

document.addEventListener("mouseup", function() {
    isDragging = false;
    subtaskHeader.style.cursor = "grab";
});

function toggleCalendar() {
    const panel = document.getElementById("deadline-panel");
    panel.style.display = panel.style.display === "none" ? "flex" : "none";
    if (panel.style.display === "flex") updateDeadlinePanel();
}

function updateDeadlinePanel() {
    const list = document.getElementById("countdown-list");
    list.innerHTML = "";

    const tasks = [];
    document.querySelectorAll("#list-container li").forEach(li => {
        const dueDate = li.dataset.dueDate;
        if (!dueDate) return;
        tasks.push({
            text: li.querySelector(".task-text").textContent,
            completed: li.classList.contains("completed"),
            dueDate: dueDate
        });
    });

    if (tasks.length === 0) {
        list.innerHTML = `<li style="color:#71717a; text-align:center;">No deadlines set yet</li>`;
        return;
    }

    // Sort by closest deadline
    tasks.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

    tasks.forEach(task => {
        const now = new Date();
        const due = new Date(task.dueDate);
        due.setHours(23, 59, 59); // end of due day
        const diff = due - now;

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

        let colorClass, countdownText;

        if (task.completed) {
            colorClass = "deadline-green";
            countdownText = "✅ Completed";
        } else if (diff < 0) {
            colorClass = "deadline-red";
            countdownText = "🔴 Overdue!";
        } else if (days < 3) {
            colorClass = "deadline-yellow";
            countdownText = `🟡 ${days}d ${hours}h left`;
        } else {
            colorClass = "deadline-green";
            countdownText = `🟢 ${days}d ${hours}h left`;
        }

        const li = document.createElement("li");
        li.classList.add(colorClass);
        li.innerHTML = `
            <span class="deadline-task-name">${task.text}</span>
            <span class="deadline-countdown">${countdownText}</span>
            <span class="deadline-countdown">📅 Due: ${due.toLocaleDateString()}</span>
        `;
        list.appendChild(li);
    });
}

// Make deadline panel draggable
const deadlinePanel = document.getElementById("deadline-panel");
const deadlineHeader = document.getElementById("deadline-header");

let isDeadlineDragging = false;
let deadlineOffsetX, deadlineOffsetY;

deadlineHeader.addEventListener("mousedown", function(e) {
    isDeadlineDragging = true;
    deadlineOffsetX = e.clientX - deadlinePanel.getBoundingClientRect().left;
    deadlineOffsetY = e.clientY - deadlinePanel.getBoundingClientRect().top;
    deadlineHeader.style.cursor = "grabbing";
});

document.addEventListener("mousemove", function(e) {
    if (!isDeadlineDragging) return;
    deadlinePanel.style.left = (e.clientX - deadlineOffsetX) + "px";
    deadlinePanel.style.top = (e.clientY - deadlineOffsetY) + "px";
    deadlinePanel.style.transform = "none";
});

document.addEventListener("mouseup", function() {
    isDeadlineDragging = false;
    deadlineHeader.style.cursor = "grab";
});

// Refresh countdowns every minute
setInterval(() => {
    const panel = document.getElementById("deadline-panel");
    if (panel.style.display !== "none") updateDeadlinePanel();
}, 60000);

function toggleHelp() {
    const overlay = document.getElementById("help-overlay");
    overlay.style.display = overlay.style.display === "none" ? "flex" : "none";
}