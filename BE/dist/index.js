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
// Hardcoded API key for testing
const OPENROUTER_API_KEY = "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";
// Environment debugging
console.log("=== ENVIRONMENT DEBUG ===");
console.log("OPENROUTER_API_KEY exists:", !!OPENROUTER_API_KEY);
console.log("OPENROUTER_API_KEY length:", (OPENROUTER_API_KEY === null || OPENROUTER_API_KEY === void 0 ? void 0 : OPENROUTER_API_KEY.length) || 0);
console.log("OPENROUTER_API_KEY starts with 'sk-or':", (OPENROUTER_API_KEY === null || OPENROUTER_API_KEY === void 0 ? void 0 : OPENROUTER_API_KEY.startsWith('sk-or')) || false);
console.log("First 15 chars:", (OPENROUTER_API_KEY === null || OPENROUTER_API_KEY === void 0 ? void 0 : OPENROUTER_API_KEY.substring(0, 15)) || 'N/A');
console.log("Current working directory:", process.cwd());
console.log("========================");
const express_1 = __importDefault(require("express"));
const prompts_1 = require("./prompts");
const node_1 = require("./defaults/node");
const react_1 = require("./defaults/react");
const cors_1 = __importDefault(require("cors"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// OpenRouter API call function with enhanced debugging
function callOpenRouter(messages_1) {
    return __awaiter(this, arguments, void 0, function* (messages, systemPrompt = null, maxTokens = 8000, model = "deepseek/deepseek-r1:free") {
        try {
            console.log("=== OPENROUTER API CALL DEBUG ===");
            console.log("Model:", model);
            console.log("Max tokens:", maxTokens);
            console.log("System prompt:", systemPrompt ? "Present" : "None");
            console.log("Messages count:", messages.length);
            const messagesWithSystem = systemPrompt
                ? [{ role: "system", content: systemPrompt }, ...messages]
                : messages;
            const requestBody = {
                model: model,
                messages: messagesWithSystem,
                max_tokens: maxTokens
            };
            console.log("Request body:", JSON.stringify(requestBody, null, 2));
            console.log("API Key present:", !!OPENROUTER_API_KEY);
            console.log("API Key format valid:", (OPENROUTER_API_KEY === null || OPENROUTER_API_KEY === void 0 ? void 0 : OPENROUTER_API_KEY.startsWith('sk-or')) || false);
            const headers = {
                "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                "Content-Type": "application/json",
                "HTTP-Referer": process.env.HTTP_REFERER || "http://localhost:3000",
                "X-Title": process.env.APP_TITLE || "Express OpenRouter App"
            };
            console.log("Request headers:", Object.assign(Object.assign({}, headers), { Authorization: headers.Authorization ? `Bearer [REDACTED-${headers.Authorization.slice(-10)}]` : 'MISSING' }));
            const response = yield fetch("https://openrouter.ai/api/v1/chat/completions", {
                method: "POST",
                headers: headers,
                body: JSON.stringify(requestBody)
            });
            console.log("Response status:", response.status);
            console.log("Response status text:", response.statusText);
            console.log("Response headers:", Object.fromEntries(response.headers.entries()));
            if (!response.ok) {
                const errorText = yield response.text();
                console.error("=== ERROR RESPONSE ===");
                console.error("Status:", response.status);
                console.error("Status Text:", response.statusText);
                console.error("Error body:", errorText);
                console.error("=====================");
                // Try to parse error JSON for more details
                try {
                    const errorJson = JSON.parse(errorText);
                    console.error("Parsed error:", errorJson);
                }
                catch (e) {
                    console.error("Could not parse error as JSON");
                }
                throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
            }
            const data = yield response.json();
            console.log("=== SUCCESS RESPONSE ===");
            console.log("Full response data:", JSON.stringify(data, null, 2));
            console.log("=======================");
            if (data.choices && data.choices[0] && data.choices[0].message) {
                return data.choices[0].message.content;
            }
            else {
                console.error("Invalid response structure:", data);
                throw new Error("Invalid response format from OpenRouter");
            }
        }
        catch (error) {
            console.error("=== OPENROUTER API ERROR ===");
            console.error("Error type:", error instanceof Error ? error.constructor.name : typeof error);
            console.error("Error message:", error instanceof Error ? error.message : String(error));
            console.error("Error stack:", error instanceof Error ? error.stack : 'No stack trace');
            console.error("===========================");
            throw error;
        }
    });
}
app.post("/template", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log("=== /template ENDPOINT ===");
        console.log("Request body:", req.body);
        const prompt = req.body.prompt;
        if (!prompt) {
            console.error("No prompt provided in request");
            res.status(400).json({ message: "Prompt is required" });
            return;
        }
        const systemPrompt = "Return either node or react based on what do you think this project should be. Only return a single word either 'node' or 'react'. Do not return anything extra";
        console.log("Making API call for template decision...");
        const answer = yield callOpenRouter([{
                role: 'user',
                content: prompt
            }], systemPrompt, 200);
        console.log("Raw AI response:", answer);
        const cleanAnswer = answer.trim().toLowerCase();
        console.log("Cleaned answer:", cleanAnswer);
        if (cleanAnswer === "react") {
            console.log("Returning React template");
            res.json({
                prompts: [prompts_1.BASE_PROMPT, `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${react_1.basePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`],
                uiPrompts: [react_1.basePrompt]
            });
            return;
        }
        if (cleanAnswer === "node") {
            console.log("Returning Node template");
            res.json({
                prompts: [`Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${node_1.basePrompt}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`],
                uiPrompts: [node_1.basePrompt]
            });
            return;
        }
        console.error("Invalid AI response:", cleanAnswer);
        res.status(400).json({ message: "Invalid response from AI model", aiResponse: cleanAnswer });
    }
    catch (error) {
        console.error("=== ERROR in /template endpoint ===");
        console.error("Error:", error);
        console.error("================================");
        res.status(500).json({ message: "Internal server error", error: error instanceof Error ? error.message : String(error) });
    }
}));
app.post("/chat", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log("=== /chat ENDPOINT ===");
        console.log("Request body:", JSON.stringify(req.body, null, 2));
        const messages = req.body.messages;
        if (!messages || !Array.isArray(messages)) {
            console.error("Invalid messages format");
            res.status(400).json({ message: "Messages array is required" });
            return;
        }
        console.log("Making API call for chat...");
        const response = yield callOpenRouter(messages, (0, prompts_1.getSystemPrompt)());
        console.log("Chat response received:", response);
        res.json({
            response: response
        });
    }
    catch (error) {
        console.error("=== ERROR in /chat endpoint ===");
        console.error("Error:", error);
        console.error("==============================");
        res.status(500).json({ message: "Internal server error", error: error instanceof Error ? error.message : String(error) });
    }
}));
// Health check endpoint
app.get("/health", (req, res) => {
    res.json({
        status: "OK",
        timestamp: new Date().toISOString(),
        environment: {
            hasApiKey: !!OPENROUTER_API_KEY,
            apiKeyValid: (OPENROUTER_API_KEY === null || OPENROUTER_API_KEY === void 0 ? void 0 : OPENROUTER_API_KEY.startsWith('sk-or')) || false
        }
    });
});
// Test endpoint for API key validation
app.get("/test-api", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log("Testing OpenRouter API connection...");
        const testResponse = yield callOpenRouter([
            { role: 'user', content: 'Say "API test successful"' }
        ], null, 50, "deepseek/deepseek-r1:free");
        res.json({
            success: true,
            message: "API test successful",
            response: testResponse
        });
    }
    catch (error) {
        console.error("API test failed:", error);
        res.status(500).json({
            success: false,
            message: "API test failed",
            error: error instanceof Error ? error.message : String(error)
        });
    }
}));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`=== SERVER STARTED ===`);
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment check:`);
    console.log(`- API Key present: ${!!OPENROUTER_API_KEY}`);
    console.log(`- API Key format: ${(OPENROUTER_API_KEY === null || OPENROUTER_API_KEY === void 0 ? void 0 : OPENROUTER_API_KEY.startsWith('sk-or')) ? 'Valid' : 'Invalid'}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log(`API test: http://localhost:${PORT}/test-api`);
    console.log(`=====================`);
});
