    const MAX_ANIM_ITEMS = 50;
    let students = [];
    let namedStudents = [];
    let remainingStudents = [];
    let isFirstTime = true;
    let isAnimating = false;

    const fileInput = document.getElementById('fileInput');
    const importBtn = document.getElementById('importBtn');
    const startBtn = document.getElementById('startBtn');
    const openSettings = document.getElementById('openSettings');
    const closeSettings = document.getElementById('closeSettings');
    const settingsPanel = document.getElementById('settingsPanel');
    const themeRadios = document.querySelectorAll('input[name="themeRadio"]');
    const resetBtn = document.getElementById('resetBtn');
    const currentStudentDiv = document.getElementById('currentStudent');
    const namedGrid = document.getElementById('namedGrid');
    const totalCount = document.getElementById('totalCount');
    const namedCount = document.getElementById('namedCount');
    const animWrapper = document.getElementById('animWrapper');
    const animContainer = document.getElementById('animContainer');

    // 简单的提示音（使用 WebAudio）
    let audioCtx = null;
    function ensureAudio() {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
    }
    function playTone(freq, duration = 60, type = 'sine') {
        try {
            ensureAudio();
            const o = audioCtx.createOscillator();
            const g = audioCtx.createGain();
            o.type = type;
            o.frequency.value = freq;
            o.connect(g);
            g.connect(audioCtx.destination);
            const now = audioCtx.currentTime;
            g.gain.setValueAtTime(0.0001, now);
            g.gain.exponentialRampToValueAtTime(0.18, now + 0.01);
            o.start(now);
            g.gain.exponentialRampToValueAtTime(0.0001, now + duration / 1000);
            o.stop(now + duration / 1000 + 0.02);
        } catch (e) {
            // Electron 环境可能不支持部分 API，静默失败
        }
    }
    function playTick() { playTone(880, 40); }
    function playSuccess() { playTone(880, 120); setTimeout(() => playTone(1320, 140), 140); }

    // 主题切换
    function applyTheme(theme) {
        if (theme === 'dark') document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', theme);
    }
    function getSystemTheme() {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    function updateThemeByRadio() {
        let theme = 'auto';
        themeRadios.forEach(r => { if (r.checked) theme = r.value; });
        if (theme === 'auto') applyTheme(getSystemTheme());
        else applyTheme(theme);
        localStorage.setItem('themeRadio', theme);
    }
    themeRadios.forEach(radio => {
        radio.addEventListener('change', updateThemeByRadio);
    });
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        let theme = localStorage.getItem('themeRadio') || 'auto';
        if (theme === 'auto') applyTheme(getSystemTheme());
    });

    // 初始化主题
    let savedThemeRadio = localStorage.getItem('themeRadio') || 'auto';
    themeRadios.forEach(r => { r.checked = (r.value === savedThemeRadio); });
    if (savedThemeRadio === 'auto') applyTheme(getSystemTheme());
    else applyTheme(savedThemeRadio);

    // 设置面板默认隐藏
    settingsPanel.classList.remove('active');
    settingsPanel.setAttribute('aria-hidden', 'true');

    openSettings.addEventListener('click', () => {
        settingsPanel.classList.add('active');
        settingsPanel.setAttribute('aria-hidden', 'false');
    });

    closeSettings.addEventListener('click', () => {
        settingsPanel.classList.remove('active');
        settingsPanel.setAttribute('aria-hidden', 'true');
    });

    importBtn.addEventListener('click', importStudentsFromFile);

    resetBtn.addEventListener('click', () => {
        if (!confirm('重置将清空已点名记录，是否继续？')) return;
        remainingStudents = [...students];
        namedStudents = [];
        isFirstTime = true;
        updateUI();
        startBtn.textContent = '开始点名';
        startBtn.disabled = students.length === 0;
        saveConfig();
    });

    startBtn.addEventListener('click', startNaming);

    function importStudentsFromFile() {
        const file = fileInput.files[0];
        if (!file) {
            alert('请选择一个txt文件');
            return;
        }
        const reader = new FileReader();
        reader.onload = function (e) {
            const text = e.target.result.replace(/\r/g, '');
            students = text.split('\n').map(s => s.trim()).filter(Boolean);
            remainingStudents = [...students];
            namedStudents = [];
            isFirstTime = true;
            updateUI();
            settingsPanel.classList.remove('active');
            settingsPanel.setAttribute('aria-hidden', 'true');
            startBtn.disabled = students.length === 0;
            startBtn.textContent = '开始点名';
            saveConfig();
        };
        reader.readAsText(file, 'utf-8');
    }

    function updateUI() {
        totalCount.textContent = students.length;
        namedCount.textContent = namedStudents.length;
        updateNamedGrid();
        if (namedStudents.length === 0 && students.length > 0) currentStudentDiv.textContent = '准备开始点名';
        if (students.length === 0) currentStudentDiv.textContent = '请在设置中导入学生名单';
        saveConfig();
    }

    function updateNamedGrid() {
        namedGrid.innerHTML = '';
        namedStudents.forEach(name => {
            const d = document.createElement('div');
            d.className = 'named-box';
            d.textContent = name;
            namedGrid.appendChild(d);
        });
    }

    // 动画总时长固定为3.5秒（使用 easing，保证最终选中与 namedList 一致）
    function startNaming() {
        if (isAnimating) return;
        if (remainingStudents.length === 0) {
            alert('所有学生已点名完毕');
            return;
        }
        isAnimating = true;
        startBtn.disabled = true;
        animContainer.innerHTML = '';
        animWrapper.classList.remove('hidden');
        animWrapper.setAttribute('aria-hidden', 'false');

        const selectedIndex = Math.floor(Math.random() * remainingStudents.length);
        const selectedStudent = remainingStudents[selectedIndex];

        let items = [];
        if (remainingStudents.length <= MAX_ANIM_ITEMS) {
            items = [...remainingStudents];
        } else {
            const sample = new Set([selectedIndex]);
            while (sample.size < MAX_ANIM_ITEMS) {
                sample.add(Math.floor(Math.random() * remainingStudents.length));
            }
            items = Array.from(sample).map(i => remainingStudents[i]);
        }
        if (!items.includes(selectedStudent)) {
            items[Math.floor(Math.random() * items.length)] = selectedStudent;
        }
        items.forEach(name => {
            const box = document.createElement('div');
            box.className = 'anim-box';
            box.textContent = name;
            animContainer.appendChild(box);
        });

        const chosenIndex = items.indexOf(selectedStudent);
        const cycles = Math.floor(Math.random() * 3) + 3; // 保持若干整圈
        const totalSteps = cycles * items.length + chosenIndex;
        const totalMs = 2500; // 保持 2.5 秒总时长

        // 新需求：将视觉速度变为原来的 0.2 倍（即更慢的切换节奏），
        // 但保持总时长不变 —— 通过减少步数来实现（每次变化更慢）
        const visualFactor = 0.2;
        let displaySteps = Math.max(1, Math.round(totalSteps * visualFactor));
        // 必须至少能到达 chosenIndex
        displaySteps = Math.max(displaySteps, chosenIndex + 1);

        // 使用更强的 ease-in 幂函数以增强后期缓动（增大后期延迟，减慢结尾速度）
        const EASE_POWER = 5; // 5 表示 quint，若需更强可调整为 6 或 7
        function easeInPower(t) { return Math.pow(t, EASE_POWER); }
        const cumTimes = [0];
        for (let s = 1; s <= displaySteps; s++) {
            cumTimes[s] = easeInPower(s / displaySteps) * totalMs;
        }
        cumTimes[displaySteps] = totalMs;

        let stepCount = 0;
        let prevActive = -1;

        function runStep() {
            // 将较少的 displaySteps 映射到 items 顺序上，产生慢速切换
            const idx = stepCount % items.length;
            if (prevActive >= 0 && animContainer.children[prevActive]) animContainer.children[prevActive].classList.remove('active');
            if (animContainer.children[idx]) animContainer.children[idx].classList.add('active');
            currentStudentDiv.textContent = items[idx];
            try { playTick(); } catch (e) {}
            prevActive = idx;
            stepCount++;
            if (stepCount <= displaySteps) {
                const delay = Math.max(12, cumTimes[stepCount] - cumTimes[stepCount - 1]);
                setTimeout(runStep, delay);
            } else {
                setTimeout(() => {
                    if (animContainer.children[prevActive]) animContainer.children[prevActive].classList.remove('active');
                    currentStudentDiv.textContent = selectedStudent;
                    animWrapper.classList.add('hidden');
                    animWrapper.setAttribute('aria-hidden', 'true');
                    const realIndex = remainingStudents.indexOf(selectedStudent);
                    if (realIndex >= 0) remainingStudents.splice(realIndex, 1);
                    namedStudents.push(selectedStudent);
                    updateUI();
                    const last = namedGrid.lastElementChild;
                    if (last) {
                        last.classList.add('added');
                        setTimeout(() => last.classList.remove('added'), 900);
                    }
                    try { playSuccess(); } catch (e) {}
                    if (isFirstTime) {
                        startBtn.textContent = '继续点名';
                        isFirstTime = false;
                    }
                    startBtn.disabled = remainingStudents.length === 0;
                    isAnimating = false;
                    saveConfig();
                }, 80);
            }
        }
        runStep();
    }

    // 配置持久化
    function saveConfig() {
        localStorage.setItem('students', JSON.stringify(students));
        localStorage.setItem('namedStudents', JSON.stringify(namedStudents));
        localStorage.setItem('remainingStudents', JSON.stringify(remainingStudents));
    }
    function loadConfig() {
        try {
            const s = JSON.parse(localStorage.getItem('students') || '[]');
            if (Array.isArray(s) && s.length > 0) {
                // 每次打开时加载上次的名单并重置（清空已点名）
                students = s;
                namedStudents = [];
                remainingStudents = [...students];
                isFirstTime = true;
                // 立刻允许按钮响应（避免启动后短时间不可点击），将重 DOM 更新延后
                startBtn.disabled = students.length === 0;
                startBtn.textContent = '开始点名';
                setTimeout(() => {
                    updateUI();
                }, 40);
            }
        } catch (e) {}
    }
    loadConfig();

    // 如果在 Electron 中运行，渲染器通常会通知主进程（renderer-ready）。
    // 为了在浏览器端正常运行（web 构建），已移除对 Electron `ipcRenderer` 的直接调用。