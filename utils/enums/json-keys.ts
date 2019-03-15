import { ReflectionKind } from "typedoc/dist/lib/models";

export enum AttributeType {
    properties = ReflectionKind.Property,
    methods = ReflectionKind.CallSignature,
    accessors = ReflectionKind.Accessor,
    functions = ReflectionKind.Function,
    getter = ReflectionKind.GetSignature,
    setter = ReflectionKind.SetSignature,
    members = ReflectionKind.EnumMember,
}

export function getAttributeType(reflectionKind: ReflectionKind){
    if (reflectionKind === ReflectionKind.Constructor){
        return AttributeType[ReflectionKind.CallSignature];
    }

    return AttributeType[reflectionKind];
}