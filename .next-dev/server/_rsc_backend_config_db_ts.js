"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
exports.id = "_rsc_backend_config_db_ts";
exports.ids = ["_rsc_backend_config_db_ts"];
exports.modules = {

/***/ "(rsc)/./backend/config/db.ts":
/*!******************************!*\
  !*** ./backend/config/db.ts ***!
  \******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"default\": () => (__WEBPACK_DEFAULT_EXPORT__)\n/* harmony export */ });\n/* harmony import */ var _prisma_client__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @prisma/client */ \"@prisma/client\");\n/* harmony import */ var _prisma_client__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_prisma_client__WEBPACK_IMPORTED_MODULE_0__);\n\nconst prismaClientSingleton = ()=>{\n    return new _prisma_client__WEBPACK_IMPORTED_MODULE_0__.PrismaClient({\n        datasources: {\n            db: {\n                url: process.env.DATABASE_URL + (process.env.DATABASE_URL?.includes(\"?\") ? \"&\" : \"?\") + \"connection_limit=50&pool_timeout=20\"\n            }\n        }\n    });\n};\nconst prisma = globalThis.prismaGlobal ?? prismaClientSingleton();\nconsole.log(\"Prisma instance initialized\");\n/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (prisma);\nif (true) globalThis.prismaGlobal = prisma;\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9iYWNrZW5kL2NvbmZpZy9kYi50cyIsIm1hcHBpbmdzIjoiOzs7Ozs7QUFBNkM7QUFFN0MsTUFBTUMsd0JBQXdCO0lBQzVCLE9BQU8sSUFBSUQsd0RBQVlBLENBQUM7UUFDdEJFLGFBQWE7WUFDWEMsSUFBSTtnQkFDRkMsS0FBS0MsUUFBUUMsR0FBRyxDQUFDQyxZQUFZLEdBQUlGLENBQUFBLFFBQVFDLEdBQUcsQ0FBQ0MsWUFBWSxFQUFFQyxTQUFTLE9BQU8sTUFBTSxHQUFFLElBQUs7WUFDMUY7UUFDRjtJQUNGO0FBQ0Y7QUFNQSxNQUFNQyxTQUFTQyxXQUFXQyxZQUFZLElBQUlWO0FBRTFDVyxRQUFRQyxHQUFHLENBQUM7QUFFWixpRUFBZUosTUFBTUEsRUFBQTtBQUVyQixJQUFJSixJQUF5QixFQUFjSyxXQUFXQyxZQUFZLEdBQUdGIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vaGVhbHRoY2FyZS1sYW5kaW5nLy4vYmFja2VuZC9jb25maWcvZGIudHM/MDc5YSJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBQcmlzbWFDbGllbnQgfSBmcm9tICdAcHJpc21hL2NsaWVudCdcblxuY29uc3QgcHJpc21hQ2xpZW50U2luZ2xldG9uID0gKCkgPT4ge1xuICByZXR1cm4gbmV3IFByaXNtYUNsaWVudCh7XG4gICAgZGF0YXNvdXJjZXM6IHtcbiAgICAgIGRiOiB7XG4gICAgICAgIHVybDogcHJvY2Vzcy5lbnYuREFUQUJBU0VfVVJMICsgKHByb2Nlc3MuZW52LkRBVEFCQVNFX1VSTD8uaW5jbHVkZXMoJz8nKSA/ICcmJyA6ICc/JykgKyAnY29ubmVjdGlvbl9saW1pdD01MCZwb29sX3RpbWVvdXQ9MjAnXG4gICAgICB9XG4gICAgfVxuICB9KVxufVxuXG5kZWNsYXJlIGNvbnN0IGdsb2JhbFRoaXM6IHtcbiAgcHJpc21hR2xvYmFsOiBSZXR1cm5UeXBlPHR5cGVvZiBwcmlzbWFDbGllbnRTaW5nbGV0b24+O1xufSAmIHR5cGVvZiBnbG9iYWw7XG5cbmNvbnN0IHByaXNtYSA9IGdsb2JhbFRoaXMucHJpc21hR2xvYmFsID8/IHByaXNtYUNsaWVudFNpbmdsZXRvbigpXG5cbmNvbnNvbGUubG9nKFwiUHJpc21hIGluc3RhbmNlIGluaXRpYWxpemVkXCIpO1xuXG5leHBvcnQgZGVmYXVsdCBwcmlzbWFcblxuaWYgKHByb2Nlc3MuZW52Lk5PREVfRU5WICE9PSAncHJvZHVjdGlvbicpIGdsb2JhbFRoaXMucHJpc21hR2xvYmFsID0gcHJpc21hXG4iXSwibmFtZXMiOlsiUHJpc21hQ2xpZW50IiwicHJpc21hQ2xpZW50U2luZ2xldG9uIiwiZGF0YXNvdXJjZXMiLCJkYiIsInVybCIsInByb2Nlc3MiLCJlbnYiLCJEQVRBQkFTRV9VUkwiLCJpbmNsdWRlcyIsInByaXNtYSIsImdsb2JhbFRoaXMiLCJwcmlzbWFHbG9iYWwiLCJjb25zb2xlIiwibG9nIl0sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(rsc)/./backend/config/db.ts\n");

/***/ })

};
;