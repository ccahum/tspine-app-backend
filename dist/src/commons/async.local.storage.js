"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomAsyncLocalStorage = exports.ALS_TOKEN = void 0;
const common_1 = require("@nestjs/common");
const async_hooks_1 = require("async_hooks");
exports.ALS_TOKEN = 'ASYNC_LOCAL_STORAGE';
let CustomAsyncLocalStorage = class CustomAsyncLocalStorage {
};
exports.CustomAsyncLocalStorage = CustomAsyncLocalStorage;
exports.CustomAsyncLocalStorage = CustomAsyncLocalStorage = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        providers: [
            {
                provide: exports.ALS_TOKEN,
                useValue: new async_hooks_1.AsyncLocalStorage(),
            },
        ],
        exports: [exports.ALS_TOKEN],
    })
], CustomAsyncLocalStorage);
//# sourceMappingURL=async.local.storage.js.map