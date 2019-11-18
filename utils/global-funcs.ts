import { ReflectionKind, ReflectionType } from "typedoc/dist/lib/models";

export class GlobalFuncs {
    public static getCmdLineArgumentValue(options, key) {
        const indx = options.findIndex((e) => e === `--${key}`);
        if (indx >= options.length - 1 || indx < 0) {
            return;
        }
    
        return options[indx + 1];
    }

    public static getKeyValuePairVal(data, key, value) {
        if (!!data && !!data[key]) {
            const res = data[key][value];
            return res ? res : value;
        }
        
        return value;
    }   

    public static isTypeLiteralVariable(reflection){
        if (!reflection.parent){
            return false;
        }
        let isTypeLiteralChild = reflection.parent.kind === ReflectionKind.TypeLiteral;

        let typeLiteralParentIsTypeAlias = reflection.parent.parent && (reflection.parent.parent.kind === ReflectionKind.TypeAlias);

        return (isTypeLiteralChild && typeLiteralParentIsTypeAlias)
    }


    public static isSupportedTypeAliasReflection(reflection){
        
        if (reflection.kind !== ReflectionKind.TypeAlias){
            return false;
        }
        if (!reflection.type){
            return false;
        }

        let reflectionType = reflection.type as ReflectionType;

        if (!reflectionType.declaration){
            return false
        }

        if (!Array.isArray(reflectionType.declaration.children)){
            return false;
        }

        return true;
    }
}