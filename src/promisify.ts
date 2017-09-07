export type AnyFunction<T> = (...args: any[]) => T;

export type Promisify = <T, U>(
    fnOrObj: object | AnyFunction<T>,
    fnName?: string
) => (...args: any[]) => Promise<U>;

const promisify = <T, U>(fnOrObj: object | AnyFunction<T>, fnName?: string) => (
    ...args: any[]
): Promise<U> => {
    return new Promise((resolve, reject) => {
        const callback = (err, results) => {
            if (err) {
                return reject(err);
            }
            resolve(results);
        };

        if (fnName) {
            fnOrObj[fnName].apply(fnOrObj, [...args, callback]);
        } else if (typeof fnOrObj === "function") {
            fnOrObj.apply(this, [...args, callback]);
        } else {
            throw new Error(
                "If no object property is passed, first argument must be a function."
            );
        }
    });
};

export default promisify;
