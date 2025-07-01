export interface FileItem{
    name: string;
    type: 'file' | 'folder';
    children?: FileItem[];
    content?: string;
    path?: string;
}

export interface FIleViewerProps{
    file:FileItem|null;
    onClose:()=> void;
}