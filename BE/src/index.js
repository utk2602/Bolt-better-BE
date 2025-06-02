"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv").config();
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const anthropic = new sdk_1.default();
async function main() {
    const msg = await anthropic.messages.create({
        model: "claude-opus-4-20250514",
        max_tokens: 1024,
        temperature: 0,
        messages: [{
                role: "user",
                content: "What is 2+2"
            }],
    });
    console.log(msg);
}
main();
