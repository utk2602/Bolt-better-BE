"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv").config();
const express_1 = __importDefault(require("express"));
const prompts_1 = require("./prompts");
const node_1 = require("./defaults/node");
const react_1 = require("./defaults/react");
const cors_1 = __importDefault(require("cors"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// OpenRouter API call function
function callOpenRouter(messages_1) {
    return __awaiter(this, arguments, void 0, function* (messages, systemPrompt = null, maxTokens = 8000, model = "deepseek/deepseek-r1:free") {
        try {
            const messagesWithSystem = systemPrompt
                ? [{ role: "system", content: systemPrompt }, ...messages]
                : messages;
            const response = yield fetch("https://openrouter.ai/api/v1/chat/completions", {
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
            const data = yield response.json();
            if (data.choices && data.choices[0] && data.choices[0].message) {
                return data.choices[0].message.content;
            }
            else {
                throw new Error("Invalid response format from OpenRouter");
            }
        }
        catch (error) {
            console.error("Error calling OpenRouter API:", error);
            throw error;
        }
    });
}
app.post("/template", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const prompt = req.body.prompt;
        const systemPrompt = "Return either node or react based on what do you think this project should be. Only return a single word either 'node' or 'react'. Do not return anything extra";
        const answer = yield callOpenRouter([{
                role: 'user',
                content: prompt
            }], systemPrompt, 200);
        const cleanAnswer = answer.trim().toLowerCase();
        if (cleanAnswer === "react") {
            res.json({
                prompts: [prompts_1.BASE_PROMPT, `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${react_1.basePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`],
                uiPrompts: [react_1.basePrompt]
            });
            return;
        }
        if (cleanAnswer === "node") {
            res.json({
                prompts: [`Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${node_1.basePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`],
                uiPrompts: [node_1.basePrompt]
            });
            return;
        }
        res.status(400).json({ message: "Invalid response from AI model" });
    }
    catch (error) {
        console.error("Error in /template endpoint:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}));
app.post("/chat", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const messages = req.body.messages;
        const response = yield callOpenRouter(messages, (0, prompts_1.getSystemPrompt)());
        console.log("OpenRouter response:", response);
        res.json({
            response: response
        });
    }
    catch (error) {
        console.error("Error in /chat endpoint:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}));
app.listen(3000, () => {
    console.log("Server running on port 3000");
});
