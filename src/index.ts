import * as path from "path";
import * as fs from "fs";
import * as prettier from "prettier";
import promisify from "./promisify";

const readFileP = promisify(fs.readFile);
const access = promisify(fs.access);
const writeFileP = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);

const writeFile = (pathToWrite: any, data: any) => writeFileP(pathToWrite, data, "utf-8");
const readFile = (pathToWrite: string) => readFileP(pathToWrite, "utf-8");
const fileExists = (pathToWrite: string) => access(pathToWrite).then(() => true, () => false);

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
    cfg: { template?: any; path?: any; templateFile?: any },
    plop: {
        getPlopfilePath: () => string;
        getDestBasePath: { (): string; (): string };
        renderString: { (arg0: any, arg1: any): string; (arg0: any, arg1: any): string };
    },
    prettierOpts: prettier.Options
) => {
    // if not already an absolute path, make an absolute path from the basePath (plopfile location)
    const makeTmplPath = (p: any) => path.resolve(plop.getPlopfilePath(), p);
    const makeDestPath = (p: any) => path.resolve(plop.getDestBasePath(), p);

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
    plop: {
        setDefaultInclude: (arg0: { actionTypes: boolean }) => void;
        setActionType: (
            arg0: string,
            arg1: (data: any, config: any, plop: any) => Promise<string>
        ) => void;
    },
    config?: prettier.Options
) {
    // Destructure prettier options out of config otherwise unrecognised properties
    // are passed to prettier and cause a console warning
    const {
        arrowParens,
        quoteProps,
        printWidth,
        tabWidth,
        useTabs,
        semi,
        singleQuote,
        trailingComma,
        bracketSpacing,
        jsxBracketSameLine,
        rangeStart,
        rangeEnd,
        parser,
        filepath,
    } = config;
    const prettierOpts = {
        arrowParens,
        quoteProps,
        printWidth,
        tabWidth,
        useTabs,
        semi,
        singleQuote,
        trailingComma,
        bracketSpacing,
        jsxBracketSameLine,
        rangeStart,
        rangeEnd,
        parser,
        filepath,
    };
    plop.setDefaultInclude({ actionTypes: true });
    plop.setActionType("pretty-add", async (data: any, config: any, plop: any) => {
        const validInterface = interfaceCheck(config);

        if (!validInterface) {
            throw validInterface;
        }

        return await prettyAdd(data, config, plop, prettierOpts);
    });
    return plop;
}

module.exports = plopPrettier;
