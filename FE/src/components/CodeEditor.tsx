import React from "react";
import Editor from "@monaco-editor/react";
import { FileItem } from "../types";

interface CodeEditorProps {
    file: FileItem | null;
}
export function CodeEditor({file}:CodeEditorProps){
    if(!file){
        return(
            <div className="h-full flex items-center jusify-center text-gray-400 ">
                Select a file to view its content
            </div>
        )
    }
    return (
        <Editor
        height="100%"
        defaultLanguage="typescript"
        theme="vs-dark"
        value={file.content|| ''}
        options={{
            readOnly:true,
            minimap:{enabled:false},
            fontSize:14,
            wordWrap:'on',
            scrollBeyondLastLine:false
        }}/>
    )
}