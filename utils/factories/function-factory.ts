import { BaseFactory } from "./base-factory";

export class FunctionFactory extends BaseFactory {
    
    constructor(name: string) {
        super(name);
    }

    public appendProperties(parentName, kind, attributeName, data) { }

    public appendParameters(parentName: any, kind: any, accessorName: any, accessorType: any, data: any) { }
}