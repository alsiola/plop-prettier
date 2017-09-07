import * as path from "path";
import * as fs from "fs";
import * as prettier from "prettier";
import promisify from "./promisify";

const readFileP = promisify(fs.readFile);
const access = promisify(fs.access);
const writeFileP = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);
const readdir = promisify(fs.readdir);

const writeFile = (pathToWrite, data) => writeFileP(pathToWrite, data, "utf-8");
const readFile = pathToWrite => readFileP(pathToWrite, "utf-8");
const fileExists = pathToWrite =>
    access(pathToWrite).then(() => true, () => false);

const interfaceCheck = action => {
    if (typeof action !== "object") {
        return `Invalid action object: ${JSON.stringify(action)}`;
    }

    const { path } = action;

    if (typeof path !== "string" || path.length === 0) {
        return `Invalid path "${path}"`;
    }

    return true;
};

const prettyAdd = async (data, cfg, plop, prettierOpts) => {
    // if not already an absolute path, make an absolute path from the basePath (plopfile location)
    const makeTmplPath = p => path.resolve(plop.getPlopfilePath(), p);
    const makeDestPath = p => path.resolve(plop.getDestBasePath(), p);

    var { template } = cfg;
    const fileDestPath = makeDestPath(plop.renderString(cfg.path || "", data));

    try {
        if (cfg.templateFile) {
            template = await readFile(makeTmplPath(cfg.templateFile));
        }
        if (template == null) {
            template = "";
        }

        // check path
        const pathExists = await fileExists(fileDestPath);

        if (pathExists) {
            throw `File already exists\n -> ${fileDestPath}`;
        } else {
            const dirExists = await fileExists(path.dirname(fileDestPath));
            if (!dirExists) {
                await mkdir(path.dirname(fileDestPath));
            }
            await writeFile(
                fileDestPath,
                prettier.format(plop.renderString(template, data), prettierOpts)
            );
        }

        // return the added file path (relative to the destination path)
        return fileDestPath.replace(path.resolve(plop.getDestBasePath()), "");
    } catch (err) {
        if (typeof err === "string") {
            throw err;
        } else {
            throw err.message || JSON.stringify(err);
        }
    }
};

function plopPrettier(
    plop,
    prettierOpts?: prettier.Options,
    actionName?: string
) {
    plop.setActionType(
        actionName || "pretty-add",
        async (data, config, plop) => {
            const validInterface = interfaceCheck(config);

            if (!validInterface) {
                throw validInterface;
            }

            return await prettyAdd(data, config, plop, prettierOpts);
        }
    );
    return plop;
}

module.exports = plopPrettier;
