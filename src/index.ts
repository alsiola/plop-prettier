import * as path from "path";
import * as fs from "fs-extra";
import * as prettier from "prettier";

interface Plop {
    getPlopfilePath: () => string;
    getDestBasePath: () => string;
    renderString: (arg0: any, arg1: any) => string;
}

const writeFile = (pathToWrite: any, data: any) =>
    fs.writeFile(pathToWrite, data, "utf-8");
const readFile = (pathToWrite: string) => fs.readFile(pathToWrite, "utf-8");
const fileExists = (pathToWrite: string) =>
    fs.access(pathToWrite).then(() => true, () => false);

const interfaceCheck = (action: { path: any }) => {
    if (typeof action !== "object") {
        return `Invalid action object: ${JSON.stringify(action)}`;
    }

    const { path } = action;

    if (typeof path !== "string" || path.length === 0) {
        return `Invalid path "${path}"`;
    }

    return true;
};

const prettyAdd = async (
    data: any,
    cfg: { template?: string; path?: string; templateFile?: string },
    plop: Plop,
    prettierOpts: prettier.Options
) => {
    const { template: optTemplate, templateFile } = cfg;

    const template =
        (templateFile
            ? await readFile(path.resolve(plop.getPlopfilePath(), templateFile))
            : optTemplate) || "";

    const fileDestPath = path.resolve(
        plop.getDestBasePath(),
        plop.renderString(cfg.path || "", data)
    );

    if (await fileExists(fileDestPath)) {
        throw `File already exists\n -> ${fileDestPath}`;
    } else {
        const dirExists = await fileExists(path.dirname(fileDestPath));
        if (!dirExists) {
            await fs.mkdir(path.dirname(fileDestPath));
        }
        await writeFile(
            fileDestPath,
            prettier.format(plop.renderString(template, data), prettierOpts)
        );
    }

    // return the added file path (relative to the destination path)
    return fileDestPath.replace(path.resolve(plop.getDestBasePath()), "");
};

function plopPrettier(
    plop: {
        setDefaultInclude: (arg0: { actionTypes: boolean }) => void;
        setActionType: (
            arg0: string,
            arg1: (data: any, config: any, plop: any) => Promise<string>
        ) => void;
    },
    config?: prettier.Options
) {
    plop.setDefaultInclude({ actionTypes: true });
    plop.setActionType(
        "pretty-add",
        (data: any, plopConfig: any, plop: any) => {
            const validInterface = interfaceCheck(plopConfig);

            if (!validInterface) {
                throw validInterface;
            }

            return prettyAdd(data, plopConfig, plop, config);
        }
    );
    return plop;
}

module.exports = plopPrettier;
