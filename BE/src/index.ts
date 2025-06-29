require("dotenv").config();
import express from "express";
import { BASE_PROMPT, getSystemPrompt } from "./prompts";
import {basePrompt as nodeBasePrompt} from "./defaults/node";
import {basePrompt as reactBasePrompt} from "./defaults/react";
import cors from "cors";

const app = express();
app.use(cors())
app.use(express.json())

// OpenRouter API call function
async function callOpenRouter(
  messages: any,
  systemPrompt: string | null = null,
  maxTokens = 8000,
  model = "deepseek/deepseek-r1:free"
) {
  try {
    const messagesWithSystem = systemPrompt 
      ? [{ role: "system", content: systemPrompt }, ...messages]
      : messages;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`, // Use environment variable
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.HTTP_REFERER || "https://localhost:3000", 
        "X-Title": process.env.APP_TITLE || "Express OpenRouter App"
      },
      body: JSON.stringify({
        model: model,
        messages: messagesWithSystem,
        max_tokens: maxTokens
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.choices && data.choices[0] && data.choices[0].message) {
      return data.choices[0].message.content;
    } else {
      throw new Error("Invalid response format from OpenRouter");
    }
  } catch (error) {
    console.error("Error calling OpenRouter API:", error);
    throw error;
  }
}

app.post("/template", async (req, res) => {
    try {
        const prompt = req.body.prompt;
        
        const systemPrompt = "Return either node or react based on what do you think this project should be. Only return a single word either 'node' or 'react'. Do not return anything extra";
        
        const answer = await callOpenRouter([{
            role: 'user', 
            content: prompt
        }], systemPrompt, 200);

        const cleanAnswer = answer.trim().toLowerCase();
        
        if (cleanAnswer === "react") {
            res.json({
                prompts: [BASE_PROMPT, `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${reactBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`],
                uiPrompts: [reactBasePrompt]
            });
            return;
        }

        if (cleanAnswer === "node") {
            res.json({
                prompts: [`Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${nodeBasePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`],
                uiPrompts: [nodeBasePrompt]
            });
            return;
        }

        res.status(400).json({message: "Invalid response from AI model"});
    } catch (error) {
        console.error("Error in /template endpoint:", error);
        res.status(500).json({message: "Internal server error"});
    }
});

app.post("/chat", async (req, res) => {
    try {
        const messages = req.body.messages;
        
        const response = await callOpenRouter(messages, getSystemPrompt());
        
        console.log("OpenRouter response:", response);

        res.json({
            response: response
        });
    } catch (error) {
        console.error("Error in /chat endpoint:", error);
        res.status(500).json({message: "Internal server error"});
    }
});

app.listen(3000, () => {
    console.log("Server running on port 3000");
});