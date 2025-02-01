// import-updater.ts
interface Options {
  dryRun?: boolean;
  extensions?: string[];
  excludeDirs?: string[];
}

const defaultOptions: Options = {
  dryRun: false,
  extensions: [".ts"],
  excludeDirs: ["node_modules", ".git", "dist_n"],
};

export async function updateImports(
  rootDir: string,
  options: Options = {}
): Promise<void> {
  const mergedOptions = { ...defaultOptions, ...options };
  const importRegex = /(import\s+(?:.*?\s+from\s+)?["'])(.*?)(\.ts)(["'])/g;

  async function processFile(filePath: string): Promise<void> {
    try {
      const original = await Deno.readTextFile(filePath);
      const modified = original.replace(importRegex, "$1$2.d.ts$4");

      if (original === modified) return;

      console.log(`\nFound in ${filePath}:`);
      original.split("\n").forEach((line, index) => {
        if (line.match(importRegex)) console.log(`Line ${index + 1}: ${line}`);
      });

      if (!mergedOptions.dryRun) {
        await Deno.writeTextFile(filePath, modified);
        console.log(`✅ Updated ${filePath}`);
      } else {
        console.log(`🔍 Would update ${filePath} (dry run)`);
      }
    } catch (error) {
      if (error instanceof Error)
        console.error(`❌ Error processing ${filePath}:`, error.message);
      else console.error(`❌ Error processing ${filePath}:`, String(error));
    }
  }

  async function traverse(dirPath: string): Promise<void> {
    for await (const entry of Deno.readDir(dirPath)) {
      const fullPath = `${dirPath}/${entry.name}`;

      if (entry.isDirectory) {
        if (!mergedOptions.excludeDirs?.includes(entry.name)) {
          await traverse(fullPath);
        }
      } else if (
        entry.isFile &&
        mergedOptions.extensions?.some((ext) => fullPath.endsWith(ext))
      ) {
        await processFile(fullPath);
      }
    }
  }

  console.log(`🚀 Starting import update in ${rootDir}`);
  await traverse(rootDir);
  console.log("\n🎉 Update complete!");
}
