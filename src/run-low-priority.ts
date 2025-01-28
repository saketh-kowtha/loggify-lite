const runLowPriority = <T>(callback: () => T | Promise<T>): Promise<T> => {
  // Use requestIdleCallback if available, otherwise fallback to setTimeout
  if ('requestIdleCallback' in window) {
    return new Promise((resolve, reject) => {
      requestIdleCallback(async () => {
        try {
          const result = await callback();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  // Fallback to setTimeout with 0 delay to run in next macrotask
  return new Promise((resolve, reject) => {
    setTimeout(async () => {
      try {
        const result = await callback();
        resolve(result);
      } catch (error) {
        reject(error);
      }
    }, 0);
  });
};

export default runLowPriority;
