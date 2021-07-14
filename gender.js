import pronouns from 'pronouns';
import pluralize from 'pluralize';
import nlp from 'compromise';

const swapPronouns = (pronoun, gender) => {
    const m = [ 'm', 'male', 'masculine', 'man' ];
    const f = [ 'f', 'female', 'feminine', 'woman' ];

    let oldP = pronouns.table
        .find(set => set.indexOf(pronoun) >= 0);
    oldP = pronouns(oldP[0]);
    const kind = Object.keys(oldP)
        .find(k => oldP[k] === pronoun);

    let newP;
    if (m.indexOf(gender.toLowerCase()) >= 0)
        newP = pronouns('he');
    else if (f.indexOf(gender.toLowerCase()) >= 0)
        newP = pronouns('she');
    else {
        newP = pronouns(gender);
        if (!newP.ref)
            newP = pronouns('they');
    }

    return newP[kind];
};

const regender = (str, gender) => {
    const phrase = nlp(str);
    const pronoun = phrase.pronouns().first();
    const verb = phrase.verbs().first();

    let newP = swapPronouns(pronoun.text(), gender);

    pronoun.replaceWith(newP);
    if (pronouns.table.find(set => set.indexOf(newP) >= 0)[0] === 'they')
        verb.replaceWith(pluralize.plural(verb.text()));
    else
        verb.replaceWith(pluralize.singular(verb.text()));

    return phrase.text();
};

export default regender;
