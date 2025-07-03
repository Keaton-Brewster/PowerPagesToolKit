type Choices = Record<string, string | number | boolean>[];

export default function (obj: string): string | null {
  if (obj === undefined || obj === null || obj.length < 1) return null;

  const choices: Choices = JSON.parse(obj) as Choices;
  const values: any[] = [];

  choices.forEach((choice) => {
    if (choice.Value) {
      values.push(choice.Value);
    }
  });

  return values.join(",");
}
