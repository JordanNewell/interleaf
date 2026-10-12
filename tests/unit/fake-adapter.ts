/**
 * A fake DataAdapter: same surface MailboxStore touches, with a ticking
 * mtime so the stat-validated cache sees writes. Shared by the store and
 * bus test files.
 */
export class FakeAdapter {
  files = new Map<string, string>();
  dirs = new Set<string>(["root"]);
  trashed: string[] = [];
  reads = 0;
  private clock = 1_000;
  private mtimes = new Map<string, number>();

  private bump(path: string): void {
    this.mtimes.set(path, ++this.clock);
  }

  async exists(path: string): Promise<boolean> {
    return this.files.has(path) || this.dirs.has(path);
  }
  async mkdir(path: string): Promise<void> {
    this.dirs.add(path);
  }
  async read(path: string): Promise<string> {
    this.reads++;
    const content = this.files.get(path);
    if (content === undefined) throw new Error(`ENOENT ${path}`);
    return content;
  }
  async write(path: string, data: string): Promise<void> {
    this.files.set(path, data);
    this.bump(path);
  }
  async append(path: string, data: string): Promise<void> {
    const current = this.files.get(path);
    this.files.set(path, (current ?? "") + data);
    this.bump(path);
  }
  async remove(path: string): Promise<void> {
    this.files.delete(path);
  }
  async rmdir(path: string): Promise<void> {
    this.dirs.delete(path);
  }
  async trashLocal(path: string): Promise<void> {
    // real adapters move the whole target to the system trash
    this.trashed.push(path);
    for (const f of [...this.files.keys()]) {
      if (f === path || f.startsWith(`${path}/`)) this.files.delete(f);
    }
    this.dirs.delete(path);
  }
  async list(path: string): Promise<{ files: string[]; folders: string[] }> {
    const prefix = `${path}/`;
    const one = (rel: string): boolean => !rel.includes("/");
    return {
      files: [...this.files.keys()]
        .filter((f) => f.startsWith(prefix) && one(f.slice(prefix.length)))
        .sort(),
      folders: [...this.dirs]
        .filter((d) => d.startsWith(prefix) && one(d.slice(prefix.length)))
        .sort(),
    };
  }
  async stat(path: string): Promise<{ type: "file" | "folder"; ctime: number; mtime: number; size: number } | null> {
    const content = this.files.get(path);
    if (content === undefined) return null;
    return { type: "file", ctime: 0, mtime: this.mtimes.get(path) ?? 0, size: content.length };
  }
}
