export default function instanceToJson(instance: any): any {
  return [...instance].reduce((obj, item) => {
    const prop: any = {};

    prop[item[0]] = item[1];
    return { ...obj, ...prop };
  }, {});
}
