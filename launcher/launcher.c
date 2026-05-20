// Simple Windows launcher in C
// - Finds a sibling exe in the same directory (the main app)
// - Spawns the main exe asynchronously with CreateProcessW
// - Shows a top-most message box "正在启动，请稍候..." with an automatic timeout
//   Uses MessageBoxTimeoutW when available, otherwise spawns a helper thread to close the
//   message box after timeout.

#define UNICODE
#define _UNICODE

#include <windows.h>
#include <shlwapi.h>
#include <wchar.h>
#include <stdio.h>
#include <stdlib.h>

static LPWSTR duplicate_wstr(const wchar_t* s) {
    if (!s) return NULL;
    size_t len = wcslen(s) + 1;
    LPWSTR d = (LPWSTR)malloc(len * sizeof(wchar_t));
    if (d) wcscpy_s(d, len, s);
    return d;
}

typedef int (WINAPI *MessageBoxTimeoutW_t)(HWND, LPCWSTR, LPCWSTR, UINT, WORD, DWORD);

struct AutoCloseParam { LPWSTR title; DWORD timeout; };

DWORD WINAPI auto_close_thread(LPVOID p) {
    struct AutoCloseParam *param = (struct AutoCloseParam*)p;
    if (!param) return 0;
    Sleep(param->timeout);
    HWND h = FindWindowW(L"#32770", param->title);
    if (h) {
        PostMessageW(h, WM_CLOSE, 0, 0);
    }
    free(param->title);
    free(param);
    return 0;
}

static LPWSTR find_candidate_exe(LPCWSTR dir, LPCWSTR selfName) {
    wchar_t pattern[MAX_PATH];
    WIN32_FIND_DATAW fd;
    HANDLE h;
    swprintf_s(pattern, MAX_PATH, L"%s\\*.exe", dir);
    h = FindFirstFileW(pattern, &fd);
    if (h == INVALID_HANDLE_VALUE) return NULL;
    LPWSTR best = NULL;
    do {
        wchar_t full[MAX_PATH];
        swprintf_s(full, MAX_PATH, L"%s\\%s", dir, fd.cFileName);
        if (_wcsicmp(full, selfName) == 0) continue;
        wchar_t lower[MAX_PATH];
        wcscpy_s(lower, MAX_PATH, fd.cFileName);
        for (wchar_t *p = lower; *p; ++p) *p = towlower(*p);
        if (!best) {
            best = _wcsdup(full);
        }
        if (wcsstr(lower, L"classcall") || wcsstr(lower, L"点星") || !wcsstr(lower, L"launcher")) {
            // prefer this candidate
            free(best);
            best = _wcsdup(full);
            break;
        }
    } while (FindNextFileW(h, &fd));
    FindClose(h);
    return best;
}

int wmain(int argc, wchar_t** argv) {
    wchar_t self[MAX_PATH];
    if (!GetModuleFileNameW(NULL, self, MAX_PATH)) {
        // fallback message
        MessageBoxW(NULL, L"正在启动，请稍候...", L"ClassCall 点星", MB_OK | MB_TOPMOST);
        return 0;
    }
    wchar_t dir[MAX_PATH];
    wcscpy_s(dir, MAX_PATH, self);
    PathRemoveFileSpecW(dir);

    LPWSTR mainExe = find_candidate_exe(dir, self);
    if (!mainExe) {
        MessageBoxW(NULL, L"正在启动，请稍候...", L"ClassCall 点星", MB_OK | MB_TOPMOST);
        return 0;
    }

    // Attempt to start the main exe
    STARTUPINFOW si;
    PROCESS_INFORMATION pi;
    ZeroMemory(&si, sizeof(si)); si.cb = sizeof(si);
    ZeroMemory(&pi, sizeof(pi));

    // CreateProcessW expects mutable command line
    wchar_t cmd[MAX_PATH*2];
    wcscpy_s(cmd, MAX_PATH*2, mainExe);
    BOOL ok = CreateProcessW(NULL, cmd, NULL, NULL, FALSE, CREATE_NEW_CONSOLE, NULL, dir, &si, &pi);
    if (ok) {
        CloseHandle(pi.hThread);
        CloseHandle(pi.hProcess);
    }

    // Show a quick top-most message box with timeout
    HMODULE user32 = LoadLibraryW(L"user32.dll");
    MessageBoxTimeoutW_t pMBT = NULL;
    if (user32) pMBT = (MessageBoxTimeoutW_t)GetProcAddress(user32, "MessageBoxTimeoutW");
    DWORD timeoutMs = 3500;
    LPCWSTR title = L"ClassCall 点星";
    LPCWSTR text = L"正在启动，请稍候...";
    UINT flags = MB_OK | MB_TOPMOST | MB_SETFOREGROUND;
    if (pMBT) {
        pMBT(NULL, text, title, flags, 0, timeoutMs);
    } else {
        // spawn auto-close thread and show MessageBoxW
        struct AutoCloseParam *param = (struct AutoCloseParam*)malloc(sizeof(*param));
        param->title = duplicate_wstr(title);
        param->timeout = timeoutMs;
        HANDLE h = CreateThread(NULL, 0, auto_close_thread, param, 0, NULL);
        if (h) CloseHandle(h);
        MessageBoxW(NULL, text, title, flags);
    }

    free(mainExe);
    return 0;
}
