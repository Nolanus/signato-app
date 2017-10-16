/* SystemJS module definition */
declare var nodeModule: NodeModule;
interface NodeModule {
  id: string;
}

declare var window: Window;
interface Window {
  process: any;
  require: any;
}

/* Add the find method to the array */
interface Array<T> {
	find(predicate: (search: T) => boolean) : T;
}
