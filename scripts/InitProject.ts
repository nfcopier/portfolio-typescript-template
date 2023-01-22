import path = require("node:path");
import fs = require("node:fs");
import simpleGit from "simple-git";

const ROOT_PATH = path.join(__dirname, "..");
const git = simpleGit();

const main = async () => {
    const variables = await getVariableValues();
    const files = getFilesIn(ROOT_PATH);
    for await (const file of files) {
        await replace(file, variables);
    }
    await git.commit("Init repository");
    await git.push();
};

async function* getFilesIn(pathLike: string): AsyncIterable<string> {
    if (pathLike.endsWith(".git") || pathLike.endsWith("node_modules") || pathLike.endsWith(".idea"))
        return [];
    const fileLikes = await fs.promises.readdir(pathLike);
    for (const fileLike of fileLikes) {
        yield* flatten(pathLike, fileLike);
    }
}

async function* flatten(pathlike: string, fileLike: string): AsyncIterable<string> {
    const fullPath = path.join(pathlike, fileLike);
    const stat = await fs.promises.stat(fullPath);
    if (stat.isFile()) yield fullPath;
    if (stat.isDirectory()) yield* getFilesIn(fullPath);
}

const getVariableValues = async () => {
    const urlConfig = await git.getConfig("remote.origin.url");
    const projectName = urlConfig.value.split("/").pop().slice(0, -4);
    const nameConfig = await git.getConfig("user.name");
    return {
        "PROJECT_NAME": projectName,
        "COPYRIGHT_OWNER": nameConfig.value
    };
};

const replace = async (filePath: string, variables: {}): Promise<void> => {
    const buffer = await fs.promises.readFile(filePath);
    const contents = buffer.toString();
    if (!contains(contents, variables)) return;
    const newContents = Object.entries(variables).reduce(replaceValue, contents);
    await fs.promises.writeFile(filePath, newContents);
    await git.add(filePath);
};

const contains = (fileContents: string, variables: {}): boolean => {
    for (const varName of Object.keys(variables)) {
        if (fileContents.includes(`{{<${varName}>}}`))
            return true;
    }
    return false;
}

const replaceValue = (cts, [varName, value]): string => {
    return cts.replace(`{{<${varName}>}}`, value);
};

main().then(() => {});
