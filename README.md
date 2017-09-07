# plop-prettier
Use prettier to format plop templates with a custom plop action type.

## Installation
````
npm i --save plop-prettier
````

## Usage
In your base plopfile, import the plopPrettier function from plop-prettier, and pass it the plop instance as an argument:
````
const aGenerator = require("./path/to/a/generator");
const plopPrettier = require("plop-prettier");

module.exports = function(plop) {
    plopPrettier(plop);

    plop.setGenerator("Generator Name", aGenerator);
};
````
You can now use the "pretty-add" action type within your generators:
````
const anAction = {
    type: "pretty-add",
    path: "path/to/generated/file",
    template: "path/to/template"
};
````

## Options
The `plopPrettier` function has two optional arguments, allowing you to use prettier options, and to set a custom action name to use in your generators.  For information on available prettier options see the [prettier docs](https://github.com/prettier/prettier#options).
````
const aGenerator = require("./path/to/a/generator");
const plopPrettier = require("plop-prettier");

module.exports = function(plop) {
    plopPrettier(plop, {
        tabWidth: 4
    }, "action-name");

    plop.setGenerator("Generator Name", aGenerator);
};
````
