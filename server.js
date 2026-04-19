const express = require("express");
const cors = require("cors");

const server = express();
server.use(cors());
server.use(express.json());

server.post("/chat", async (req, res) => {
    const { message } = req.body;

    try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer YOUR_GROQ_API_KEY_HERE`
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [{ role: "user", content: message }]
            })
        });

        const data = await response.json();
        console.log("Groq response:", JSON.stringify(data));

        if (data.choices && data.choices[0]) {
            res.json({ reply: data.choices[0].message.content });
        } else {
            res.json({ reply: "Sorry, something went wrong. Please try again." });
        }
    } catch (err) {
        console.error("Chat error:", err);
        res.status(500).json({ reply: "Server error. Please try again." });
    }
});

server.listen(3000, () => {
    console.log("Server running on port 3000");
    if (process.send) process.send('ready');
});