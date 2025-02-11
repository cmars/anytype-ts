module.exports = {
  "env": {
    "browser": true,
    "es2021": true
  },
  "extends": [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier"
  ],
  "overrides": [],
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaVersion": "latest",
    "sourceType": "module"
  },
  "plugins": ["react", "@typescript-eslint"],
  "rules": {
    "member-access": 0,
    "ordered-imports": 0,
    "quotemark": 0,
    "no-console": 0,
    "semicolon": 0,
    "jsx-no-lambda": 0,
    "jsx-no-multiline-js": 0
  },
  "settings": {
    "react": {
      "version": "detect"
    }
  }
}
