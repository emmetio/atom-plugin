module.exports = {
    "env": {
        "es6": true,
        "node": true,
        "mocha": true,
        "browser": true
    },
    "globals": {
        "atom": true
    },
    "extends": "eslint:recommended",
    "parserOptions": {
        "sourceType": "module",
        "ecmaFeatures": {
            "experimentalObjectRestSpread": true
        }
    },
    "rules": {
        "indent": ["error", "tab", {
            SwitchCase: 1,
            VariableDeclarator: 1,
            outerIIFEBody: 1,
            MemberExpression: "off"
        }],
        "linebreak-style": [
            "error",
            "unix"
        ],
        "quotes": [
            "error",
            "single"
        ],
        "semi": [
            "error",
            "always"
        ],
        "no-cond-assign": "off",
        "no-empty": [
            "error",
            { "allowEmptyCatch": true }
        ],
        "no-console": "warn"
    }
};
