import type { AppId } from './apps'

// The OS's virtual file system, shared by the file manager and the terminal.

export type FileNode =
  | { kind: 'folder'; name: string; children: FileNode[] }
  | { kind: 'text'; name: string; content: () => string }
  | { kind: 'image'; name: string; src: string }
  | { kind: 'app'; name: string; app: AppId }

function notes() {
  try {
    return localStorage.getItem('kage-notes') ?? '(vide : ouvre l’app Notes pour écrire)'
  } catch {
    return '(indisponible)'
  }
}

export const root: FileNode = {
  kind: 'folder',
  name: '影',
  children: [
    {
      kind: 'folder',
      name: 'Documents',
      children: [
        { kind: 'text', name: 'readme.txt', content: () => 'Bienvenue dans 影OS.\n\nDouble-clique sur les icônes du bureau, fais un clic droit pour plus d’options,\nou ouvre le Terminal et tape « help ».' },
        { kind: 'text', name: 'todo.txt', content: () => '- finir la room 3D\n- dormir un peu\n- battre mon record sur Lueur\n- apprendre 10 nouveaux kanji' },
        {
          kind: 'text',
          name: 'manifeste.txt',
          content: () =>
            'L’ombre n’est pas l’absence de lumière.\nElle en est la preuve.\n\nCe système a été construit dans le calme, ligne après ligne,\npar Gounteni David.',
        },
        { kind: 'text', name: 'notes.txt', content: notes },
        { kind: 'text', name: 'secret.txt', content: () => 'Permission refusée.\nEssaie peut-être « sudo » dans le Terminal… ou pas.' },
      ],
    },
    { kind: 'folder', name: 'Images', children: [{ kind: 'image', name: 'avatar.webp', src: 'avatar.webp' }] },
    {
      kind: 'folder',
      name: 'Applications',
      children: [
        { kind: 'app', name: 'Ambiance', app: 'ambiance' },
        { kind: 'app', name: 'Terminal', app: 'terminal' },
        { kind: 'app', name: 'Focus', app: 'focus' },
        { kind: 'app', name: 'Kanji Quiz', app: 'kanji' },
        { kind: 'app', name: 'Lueur', app: 'lueur' },
        { kind: 'app', name: 'Notes', app: 'notes' },
        { kind: 'app', name: 'Réglages', app: 'settings' },
      ],
    },
  ],
}

/** Finds a node from a path like ["Documents", "todo.txt"]. */
export function resolve(path: string[]): FileNode | null {
  let node: FileNode = root
  for (const part of path) {
    if (node.kind !== 'folder') return null
    const next: FileNode | undefined = node.children.find((c) => c.name.toLowerCase() === part.toLowerCase())
    if (!next) return null
    node = next
  }
  return node
}
