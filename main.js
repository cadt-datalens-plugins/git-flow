// Git 工作流插件：
// - 依赖 CaDt-DataLens 内置的进程桥（cadt.runCommandSync）与虚拟文档（cadt.openVirtualDoc）
// - 调用系统 PATH 中的 git，对「当前打开文件所在仓库」执行只读查询
// - 没有系统 git 时会给出明确提示，不影响应用其他功能

const LOG_FORMAT = '%h | %ad | %an | %s';

function activeDir() {
    const f = cadt.getActiveFile();
    if (!f || !f.path) {
        cadt.flash('请先打开一个文件，插件会用它所在目录运行 git');
        return null;
    }
    return f.path.replace(/[\\/][^\\/]*$/, '');
}

function activePath() {
    const f = cadt.getActiveFile();
    return f && f.path ? f.path : '';
}

function git(args, title, aceMode) {
    const cwd = activeDir();
    if (!cwd) return;
    let res;
    try {
        res = cadt.runCommandSync({exe: 'git', args, cwd, timeoutMs: 20000});
    } catch (e) {
        cadt.flash('运行 git 失败（请确认已安装并加入 PATH）：' + e);
        return;
    }
    if (res.code !== 0) {
        const err = (res.stderr || '').trim();
        if (/不是 git 仓库|not a git repository/i.test(err)) {
            cadt.flash('当前目录不在 git 仓库内');
        } else {
            cadt.flash('git 返回 ' + res.code + '：' + (err || res.stdout || '').trim());
        }
        return;
    }
    cadt.openVirtualDoc(title, (res.stdout || '').trim() || '（无输出）', {aceMode: aceMode || 'text', readOnly: true});
}

const MARKS = {
    staged: {M: '已暂存修改', A: '已暂存新增', D: '已暂存删除', R: '已暂存重命名', C: '已暂存复制', T: '已暂存类型变更'},
    work: {M: '已修改', D: '已删除', R: '重命名', C: '复制', T: '类型变更', U: '未合并', '?': '未跟踪', '!': '已忽略'},
};

function describeXY(x, y) {
    const one = (ch, staged) => {
        if (!ch || ch === ' ') return null;
        return (staged ? MARKS.staged : MARKS.work)[ch] || ch;
    };
    const xs = one(x, true);
    const ys = one(y, false);
    if (xs && ys) return xs + ' + ' + ys;
    return xs || ys || '未知';
}

function formatStatus(raw) {
    const parts = raw.split('\0');
    const lines = [];
    for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (!part || part.length < 4) continue;
        const x = part[0];
        const y = part[1];
        const path = part.slice(3);
        if (x === 'R' || x === 'C' || y === 'R' || y === 'C') {
            const orig = parts[++i] || '';
            lines.push('[' + describeXY(x, y) + '] ' + path + '  ←  ' + orig);
        } else {
            lines.push('[' + describeXY(x, y) + '] ' + path);
        }
    }
    return lines.length ? lines.join('\n') : '（工作区干净，没有变更）';
}

cadt.addCommand({
    id: 'status',
    label: 'Git：变更列表',
    run() {
        const cwd = activeDir();
        if (!cwd) return;
        let res;
        try {
            res = cadt.runCommandSync({
                exe: 'git',
                args: ['status', '--porcelain=v1', '-z', '--untracked-files=normal'],
                cwd,
                timeoutMs: 20000,
            });
        } catch (e) {
            cadt.flash('运行 git 失败（请确认已安装并加入 PATH）：' + e);
            return;
        }
        if (res.code !== 0) {
            cadt.flash('git 返回 ' + res.code + '：' + (res.stderr || '').trim());
            return;
        }
        cadt.openVirtualDoc('Git 变更列表 — ' + cwd, formatStatus(res.stdout), {readOnly: true});
    },
});

cadt.addCommand({
    id: 'recent-log',
    label: 'Git：最近历史（50 条）',
    run() {
        git(['log', '-n', '50', '--date=format:%Y-%m-%d %H:%M', '--pretty=format:' + LOG_FORMAT], 'Git 历史（最近 50 条）');
    },
});

cadt.addCommand({
    id: 'file-log',
    label: 'Git：当前文件历史',
    run() {
        const path = activePath();
        if (!path) {
            cadt.flash('请先打开一个文件');
            return;
        }
        git(['log', '--follow', '-n', '50', '--date=format:%Y-%m-%d %H:%M', '--pretty=format:' + LOG_FORMAT, '--', path],
            'Git 文件历史 — ' + path.replace(/^.*[\\/]/, ''));
    },
});

cadt.addCommand({
    id: 'file-diff',
    label: 'Git：当前文件差异（对比 HEAD）',
    run() {
        const path = activePath();
        if (!path) {
            cadt.flash('请先打开一个文件');
            return;
        }
        git(['diff', 'HEAD', '--', path], 'Git 差异 — ' + path.replace(/^.*[\\/]/, ''), 'diff');
    },
});

cadt.addCommand({
    id: 'branches',
    label: 'Git：分支列表',
    run() {
        git(['branch', '-vv', '--sort=-committerdate'], 'Git 分支');
    },
});
