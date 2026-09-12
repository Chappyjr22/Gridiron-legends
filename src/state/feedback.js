const listeners=new Set();
export function onFeedback(listener){listeners.add(listener);return ()=>listeners.delete(listener);}
export function feedback(type){for(const listener of listeners)listener(type);}
