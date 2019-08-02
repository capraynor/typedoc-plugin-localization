import { ReflectionKind } from "typedoc/dist/lib/models";

export enum AttributeType {
    properties = ReflectionKind.Property,
    methods = ReflectionKind.CallSignature,
    accessors = ReflectionKind.Accessor,
    functions = ReflectionKind.Function,
    getter = ReflectionKind.GetSignature,
    setter = ReflectionKind.SetSignature,
    members = ReflectionKind.EnumMember,
    constructorSignature = ReflectionKind.ConstructorSignature,
    events = ReflectionKind.Event
}

export function getAttributeType(reflectionKind: ReflectionKind){
    if (reflectionKind === ReflectionKind.Constructor){
        return AttributeType[ReflectionKind.CallSignature];
    }

    if(reflectionKind === ReflectionKind.ConstructorSignature) {
        return AttributeType[ReflectionKind.ConstructorSignature];
    }

    return AttributeType[reflectionKind];
}