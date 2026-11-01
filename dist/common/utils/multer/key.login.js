"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginTrialsKey = void 0;
const loginTrialsKey = ({ email }) => {
    return `User::${email}::Login`;
};
exports.loginTrialsKey = loginTrialsKey;
