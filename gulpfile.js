const { src, dest, series, watch } = require(`gulp`);
const del = require(`del`);
const babel = require(`gulp-babel`);
const htmlCompressor = require(`gulp-htmlmin`);
const htmlValidator = require(`gulp-html`);
const jsLinter = require(`gulp-eslint`);
const jsCompressor = require(`gulp-uglify`);
const browserSync = require(`browser-sync`);
const reload = browserSync.reload;
let browserChoice = `default`;

async function safari () {
    browserChoice = `safari`;
}

async function firefox () {
    browserChoice = `firefox`;
}

async function chrome () {
    browserChoice = `google chrome`;
}

async function opera () {
    browserChoice = `opera`;
}

async function allBrowsers () {
    browserChoice = [
        `safari`,
        `firefox`,
        `google chrome`,
        `opera`,

    ];
}

let validateHTML = () => {
    return src([
        `html/index.html`
    ])
        .pipe(htmlValidator());
};

let compressHTML = () => {
    return src([`html/index.html`])
        .pipe(htmlCompressor({collapseWhitespace: true}))
        .pipe(dest(`prod`));
};

let compileCSSForDev = () => {
    return src(`css/styles.css`)
        .pipe(dest(`temp/styles`));
};

let compileCSSForProd = () => {
    return src(`css/styles.css`)
        .pipe(dest(`prod/styles`));
};

let transpileJSForDev = () => {
    return src(`dev/scripts/*.js`)
        .pipe(babel())
        .pipe(dest(`temp/scripts`));
};

let transpileJSForProd = () => {
    return src(`js/temp/*.js`)
        .pipe(babel())
        .pipe(jsCompressor())
        .pipe(dest(`prod/scripts`));

};

let lintJS = () => {
    return src(`dev/scripts/*.js`)
        .pipe(jsLinter({
            parserOptions: {
                ecmaVersion: 2017,
                sourceType: `module`
            },
            rules: {
                indent: [2, 4, {SwitchCase: 1}],
                quotes: [2, `backtick`],
                semi: [2, `always`],
                'linebreak-style': [2, `unix`],
                'max-len': [1, 85, 4]
            },
            env: {
                es6: true,
                node: true,
                browser: true
            },
            extends: `eslint:recommended`
        }))
        .pipe(jsLinter.formatEach(`compact`, process.stderr));
};

let copyUnprocessedAssetsForProd = () => {
    return src([
        `dev/*.*`,       // Source all files,
        `dev/**`,        // and all folders,
        `!dev/html/`,    // but not the HTML folder
        `!dev/html/*.*`, // or any files in it
        `!dev/html/**`,  // or any sub folders;
        `!dev/**/*.js`,  // ignore JS;
        `!dev/styles/**` // and, ignore Sass/CSS.
    ], {dot: true}).pipe(dest(`prod`));
};


let serve = () => {
    browserSync({
        notify: true,
        port: 63342,
        reloadDelay: 5,
        browser: browserChoice,
        server: {
            baseDir: [
                `dev/html`,
                `./`
            ]
        }
    });

    watch(`js/app.js`,
        series(lintJS, transpileJSForDev)
    ).on(`change`, reload);

    watch(`css/style.css`,
        series(compileCSSForDev)
    ).on(`change`, reload);

    watch(`html/index.html`,
        series(validateHTML)
    ).on(`change`, reload);

};

async function clean() {
    let fs = require(`fs`),
        i,
        foldersToDelete = [`./temp`, `prod`];

    for (i = 0; i < foldersToDelete.length; i++) {
        try {
            fs.accessSync(foldersToDelete[i], fs.F_OK);
            process.stdout.write(`\n\tThe ` + foldersToDelete[i] +
                ` directory was found and will be deleted.\n`);
            del(foldersToDelete[i]);
        } catch (e) {
            process.stdout.write(`\n\tThe ` + foldersToDelete[i] +
                ` directory does NOT exist or is NOT accessible.\n`);
        }
    }

    process.stdout.write(`\n`);
}

async function listTasks () {
    let exec = require(`child_process`).exec;

    exec(`gulp --tasks`, function (error, stdout, stderr) {
        if (null !== error) {
            process.stdout.write(`An error was likely generated when invoking ` +
                `the “exec” program in the default task.`);
        }

        if (`` !== stderr) {
            process.stdout.write(`Content has been written to the stderr stream ` +
                `when invoking the “exec” program in the default task.`);
        }

        process.stdout.write(`\n\tThis default task does ` +
            `nothing but generate this message. The ` +
            `available tasks are:\n\n${stdout}`);
    });
}

exports.safari = series(safari, serve);
exports.firefox = series(firefox, serve);
exports.chrome = series(chrome, serve);
exports.opera = series(opera, serve);
exports.safari = series(safari, serve);
exports.allBrowsers = series(allBrowsers, serve);
exports.validateHTML = validateHTML;
exports.compressHTML = compressHTML;
exports.compileCSSForDev = compileCSSForDev;
exports.compileCSSForProd = compileCSSForProd;
exports.transpileJSForDev = transpileJSForDev;
exports.transpileJSForProd = transpileJSForProd;
exports.lintJS = lintJS;
exports.copyUnprocessedAssetsForProd = copyUnprocessedAssetsForProd;
exports.build = series(
    compressHTML,
    compileCSSForProd,
    transpileJSForProd,
    copyUnprocessedAssetsForProd
);
exports.serve = series(compileCSSForDev, lintJS, transpileJSForDev, validateHTML,
    serve);
exports.clean = clean;
exports.default = listTasks;
