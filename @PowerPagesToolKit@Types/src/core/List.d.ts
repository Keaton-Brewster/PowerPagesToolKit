/// <reference path="../globals.d.ts" />
export default class List {
    private static _instance;
    private _root;
    private _listItems;
    private _observer;
    private constructor();
    static get(): List;
    private _observe;
    private _update;
    private _destroy;
    destroy(): void;
}
