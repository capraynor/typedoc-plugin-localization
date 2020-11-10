import { BaseFactory } from "./base-factory";

export class VariableFactory extends BaseFactory {
    
    constructor(name: string) {
        super(name);
    }

    public appendProperties(parentName, kind, attributeName, data) { }

    public appendAccessor(parentName: any, kind: any, accessorName: any, accessorType: any, data: any) { }
}