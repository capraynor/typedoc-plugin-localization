import { BaseFactory } from "./base-factory";

export class VariableFactory extends BaseFactory {
    
    constructor(name: string) {
        super(name);
    }

    public appendAttribute(parentName, kind, attributeName, data) { }

    public appendAccessorAttributes(parentName: any, kind: any, accessorName: any, accessorType: any, data: any) { }
    public appendMethodParameterAttributes(parentName: any, kind: any, accessorName: any, accessorType: any, data: any, currentItemName: any) { }
    public appendConstructorParameterAttributes(parentName: any, kind: any, accessorName: any, accessorType: any, data: any) { }
}