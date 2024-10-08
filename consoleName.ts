export function ConsoleName<T>() {
  return (
    classPrototype: Object,
    methodName: string | symbol,
    descriptor: TypedPropertyDescriptor<any>
  ) => {
    const originalMethod = descriptor.value as Function;

    descriptor.value = async function (this, ...args: unknown[]) {
      console.log(
        "\u001b[1;32m",
        `Running ${methodName.toString()}...`,
        "\u001b[0m",
        { args }
      );
      const response = await originalMethod.call(this, ...args);
      console.log(
        "\u001b[1;33m",
        `End ${methodName.toString()}...`,
        "\u001b[0m",
        { response }
      );
      return Promise.resolve(response);
    };
  };
}
