#!/usr/bin/env bash
# =============================================================================
# 不离手账 · 仓库冗余清理脚本
# 作用：删除反复上传产生的重复文件、空日志、开发截图，以及历史打包快照 release/
# 用法：把本脚本放到你的仓库根目录（与 app.js / index.html 同级），然后：
#         bash 清理冗余文件.sh
#       清理后用 git 提交：
#         git add -A && git commit -m "清理冗余文件，优化仓库体积"
#         git push
# 安全说明：脚本只删除“明确无用”的文件；assets/、android-app/、生效的
#           app.js/styles.css/index.html/sw.js/manifest.webmanifest 一律不动。
# =============================================================================
set -u

# 必须在仓库根目录运行（以 index.html + app.js 为标志）
if [ ! -f index.html ] || [ ! -f app.js ]; then
  echo "✗ 未在仓库根目录（找不到 index.html / app.js）。请 cd 到仓库根目录后再运行。"
  exit 1
fi

echo "===== 1/4 删除重复的代码文件副本（浏览器下载重复上传产生的 (1)(2)… 副本）====="
# 注意带空格与括号的文件名，使用精确匹配
for f in "app (1).js" "app (2).js" "app (3).js" \
         "index (1).html" "index (2).html" "index (3).html" "index (4).html" \
         "styles (1).css" "styles (2).css" "styles (3).css" "styles (4).css" "styles (5).css" "styles (6).css" \
         "sw (1).js" "manifest (1).webmanifest"; do
  if [ -e "$f" ]; then rm -f "$f" && echo "  已删除：$f"; fi
done

echo "===== 2/4 删除空日志文件 ====="
for f in _local-server.err.log _local-server.out.log _preview-server.err.log _preview-server.out.log \
         _python-http.err.log _python-http.out.log _server8080.err.log _server8080.out.log; do
  if [ -e "$f" ]; then rm -f "$f" && echo "  已删除：$f"; fi
done

echo "===== 3/4 删除开发截图（应用不引用，仅是调试留存）====="
for f in __bloom-*.png preview-home.png preview-flyleaf-1.png preview-flyleaf-1-desktop.png; do
  for g in $f; do
    if [ -e "$g" ]; then rm -f "$g" && echo "  已删除：$g"; fi
  done
done

echo "===== 4/4 历史打包快照 release/ （体积最大，约 1GB）====="
if [ -d release ]; then
  size=$(du -sh release 2>/dev/null | cut -f1)
  echo "  发现 release/ 目录，体积约 ${size}，内含多份带日期的历史打包副本。"
  echo "  这些是旧版本的整包快照，删除不影响当前应用运行。"
  printf "  是否删除 release/ ？(y/N) "
  read -r ans
  case "$ans" in
    y|Y|yes|YES)
      rm -rf release && echo "  已删除：release/" ;;
    *)
      echo "  已跳过 release/（如需删除可手动执行： rm -rf release ）" ;;
  esac
fi

echo ""
echo "✓ 清理完成。建议接着执行："
echo "    git add -A"
echo "    git commit -m \"清理冗余文件，优化仓库体积\""
echo "    git push"
echo ""
echo "提示：.git 历史里仍保留着这些大文件的旧版本（仓库 .git 约 140MB）。"
echo "      若想彻底瘦身历史，需要 git filter-repo 重写历史——属于进阶操作，"
echo "      详见《代码审核报告.md》第 7 节，建议先备份再做。"
