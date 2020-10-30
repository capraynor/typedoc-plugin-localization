export class Parser {
    public splitByCharacter(text, char) {
        // when have multiline comments, it will ignore the empty line.
        // it's diffrent from the specification.
        //const res = this.removeEmptyStrings(text.split(char));
        const res = text.split(char);
        if (res.length === 1) {
            return res[0]
        }

        return res;
    }

    public joinByCharacter(obj, char) {
        if (!Array.isArray(obj)) {
            return obj;
        }

        return obj.join(char);
    }

    private removeEmptyStrings(splittedText) {
        return splittedText.filter(el => el !== "");
    }
}