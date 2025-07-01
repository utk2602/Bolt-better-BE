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
export interface Step{
    id:number;
    title:string;
    description:string;
    status: 'pending' | 'in-progress' | 'completed';
    code?: string;
    path?: string;
}