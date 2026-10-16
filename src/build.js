import { fileURLToPath } from 'url';
import fs from 'fs';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const COURSES_DIR = path.join(ROOT, 'content', 'courses');

function clean() {
  if (fs.existsSync(DIST)) fs.rmSync(DIST, { recursive: true, force: true });
  fs.mkdirSync(DIST, { recursive: true });
}

function loadCourses() {
  if (!fs.existsSync(COURSES_DIR)) return [];
  return fs.readdirSync(COURSES_DIR)
    .filter(d => /^\d+/.test(d) && fs.statSync(path.join(COURSES_DIR, d)).isDirectory())
    .sort()
    .map(dir => {
      const infoPath = path.join(COURSES_DIR, dir, 'info.json');
      if (!fs.existsSync(infoPath)) return null;
      const info = JSON.parse(fs.readFileSync(infoPath, 'utf-8'));
      info.slug = dir;
      const coverExt = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
      for (const ext of coverExt) {
        if (fs.existsSync(path.join(COURSES_DIR, dir, `cover.${ext}`))) {
          info.coverImage = `content/courses/${dir}/cover.${ext}`;
          break;
        }
      }
      info.works = (info.works || []).map((w, i) => {
        if (w.image) {
          w.imagePath = `content/courses/${dir}/${w.image}`;
        } else {
          for (const ext of coverExt) {
            const f = `work${i + 1}.${ext}`;
            if (fs.existsSync(path.join(COURSES_DIR, dir, f))) {
              w.imagePath = `content/courses/${dir}/${f}`;
              break;
            }
          }
        }
        return w;
      });
      info.workCount = info.works.length;
      return info;
    })
    .filter(Boolean);
}

function copyDirSync(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDirSync(s, d);
    else fs.copyFileSync(s, d);
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quote;');
}

function shell(title, content, extraHead = '', prefix = '') {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)} - 剪纸小家</title>
  <link rel="stylesheet" href="${prefix}style.css">
  ${extraHead}
</head>
<body>
  <header class="site-header">
    <div class="container header-inner">
      <a href="${prefix}index.html" class="logo">
        <span class="logo-icon">✂</span>
        <span class="logo-text">剪纸小家</span>
      </a>
      <nav>
        <a href="${prefix}index.html" class="nav-link">首页</a>
        <a href="${prefix}submit.html" class="nav-link">上传照片</a>
        <a href="${prefix}about.html" class="nav-link">关于</a>
      </nav>
    </div>
  </header>
  <main>${content}</main>
  <footer class="site-footer">
    <div class="container">
      <p>剪纸小家 · 剪出属于我们的故事</p>
      <p class="footer-sub">上海市社区创课大赛项目</p>
    </div>
  </footer>
</body>
</html>`;
}

function buildIndex(courses) {
  const cards = courses.map(c => {
    const cover = c.coverImage
      ? `<img src="${c.coverImage}" alt="${escapeHtml(c.title)}" loading="lazy">`
      : `<div class="cover-ph"><span>✂</span></div>`;
    return `
    <a href="${c.slug}/index.html" class="course-card">
      <div class="card-cover">${cover}</div>
      <div class="card-body">
        <h3 class="card-title">${escapeHtml(c.title)}</h3>
        <p class="card-date">${escapeHtml(c.date)}</p>
        <p class="card-desc">${escapeHtml(c.description)}</p>
        <div class="card-meta">
          <span>${c.workCount} 张上课实录</span>
          <span class="arrow">→</span>
        </div>
      </div>
    </a>`;
  }).join('\n');

  const content = `
    <section class="hero">
      <div class="container">
        <h1>✂ 剪纸小家</h1>
        <p class="hero-sub">以剪纸为主题的社区创课 · 一个安静的作品小家</p>
        <div class="hero-deco">
          <span></span><span></span><span></span>
        </div>
      </div>
    </section>
    <section class="courses-section">
      <div class="container">
        <h2 class="section-title">全部课程</h2>
        <div class="course-grid">${cards}</div>
      </div>
    </section>`;
  return shell('首页', content);
}

function buildCoursePage(course, courses) {
  const cover = course.coverImage
    ? `<img src="../${course.coverImage}" alt="${escapeHtml(course.title)}">`
    : `<div class="cover-ph large"><span>✂</span></div>`;

  const steps = (course.tutorial || []).map((s, i) => `
      <div class="step">
        <div class="step-num">${i + 1}</div>
        <div class="step-text">${escapeHtml(s)}</div>
      </div>`).join('\n');

  const works = (course.works || []).map(w => {
    if (w.imagePath) {
      return `
      <div class="work-item" onclick="openLightbox('../${w.imagePath}','${escapeHtml(w.name)}','${escapeHtml(w.thought)}')">
        <img src="../${w.imagePath}" alt="${escapeHtml(w.name)}的作品" loading="lazy">
        <div class="work-overlay">
          <p class="work-name">${escapeHtml(w.name)}</p>
          <p class="work-thought">"${escapeHtml(w.thought)}"</p>
        </div>
      </div>`;
    }
    return `
    <div class="work-item no-img">
      <div class="work-placeholder">✂</div>
      <div class="work-overlay visible">
        <p class="work-name">${escapeHtml(w.name)}</p>
        <p class="work-thought">"${escapeHtml(w.thought)}"</p>
      </div>
    </div>`;
  }).join('\n');

  const otherCourses = courses
    .filter(c => c.slug !== course.slug)
    .map(c => `<a href="../${c.slug}/index.html" class="other-link">${escapeHtml(c.title)} →</a>`)
    .join('');

  const content = `
    <div class="course-header">
      <div class="container">
        <a href="../index.html" class="back-link">← 返回课程列表</a>
        <h1>${escapeHtml(course.title)}</h1>
        <p class="course-date">${escapeHtml(course.date)}</p>
        <p class="course-desc">${escapeHtml(course.description)}</p>
      </div>
    </div>
    <div class="container course-body">
      <section class="cover-section">
        <h2 class="section-title">课程样图</h2>
        <div class="cover-large">${cover}</div>
      </section>
      <section class="tutorial-section">
        <h2 class="section-title">教程步骤</h2>
        <div class="steps">${steps}</div>
      </section>
      <section class="works-section">
        <h2 class="section-title">上课实录 <span class="work-count">(${course.workCount}张)</span></h2>
        ${course.workCount > 0
          ? `<div class="work-grid">${works}</div>`
          : `<p class="empty-hint">还没有上课实录照片，快来上传吧！</p>`}
        <div class="submit-cta">
          <a href="../submit.html" class="btn-submit">上传课堂照片</a>
        </div>
      </section>
      ${otherCourses ? `<section class="other-section"><h2 class="section-title">其他课程</h2><div class="other-links">${otherCourses}</div></section>` : ''}
    </div>
    <div class="lightbox" id="lightbox" onclick="closeLightbox()">
      <button class="lb-close" onclick="closeLightbox()">×</button>
      <div class="lb-content" onclick="event.stopPropagation()">
        <img id="lb-img" src="" alt="">
        <div class="lb-info">
          <p id="lb-name"></p>
          <p id="lb-thought"></p>
        </div>
      </div>
    </div>
    <script>
function openLightbox(src,name,thought){
  var lb=document.getElementById('lightbox');
  document.getElementById('lb-img').src=src;
  document.getElementById('lb-name').textContent=name+' 的作品';
  document.getElementById('lb-thought').textContent='"'+thought+'"';
  lb.classList.add('open');
  document.body.style.overflow='hidden';
}
function closeLightbox(){
  document.getElementById('lightbox').classList.remove('open');
  document.body.style.overflow='';
}
document.addEventListener('keydown',function(e){if(e.key==='Escape')closeLightbox();});
    </script>`;
  return shell(course.title, content, '', '../');
}

function buildAbout() {
  const content = `
    <div class="about-hero">
      <div class="container">
        <h1>关于剪纸小家</h1>
        <p class="about-sub">以剪纸为主题的社区空间，一个安静的作品小家</p>
      </div>
    </div>
    <div class="container about-body">
      <section class="about-section">
        <h2>我们是什么</h2>
        <p>剪纸小家是一个围绕剪纸课程的社区空间。</p>
        <p>在这里，每一节课都会留下三样东西：</p>
        <div class="about-features">
          <div class="feature"><div class="feature-icon">🎨</div><h3>样图</h3><p>这节课要剪成什么样</p></div>
          <div class="feature"><div class="feature-icon">📖</div><h3>教程</h3><p>一步一步，怎么剪出来</p></div>
          <div class="feature"><div class="feature-icon">✨</div><h3>上课实录</h3><p>课堂上的作品与精彩瞬间</p></div>
        </div>
        <p>它不是一个大而全的社区广场，而是一间<strong>安静的小家</strong>——内容经过用心整理，作品被认真对待。</p>
      </section>
      <section class="about-section">
        <h2>怎么参与</h2>
        <p>每个人都可以上传课堂照片和感受。流程很简单：</p>
        <div class="about-steps">
          <div class="about-step"><div class="step-circle">1</div><p>打开网站，点「上传照片」</p></div>
          <div class="about-step"><div class="step-circle">2</div><p>填写表单（姓名 / 哪一节课 / 你的感受 / 上传照片）</p></div>
          <div class="about-step"><div class="step-circle">3</div><p>老师收到后审核，确认内容合适</p></div>
          <div class="about-step"><div class="step-circle">4</div><p>上课实录正式上线，出现在对应课程的上课实录里</p></div>
        </div>
        <h3>上传需要准备什么</h3>
        <ul>
          <li><strong>你的名字</strong>：想让大家看到的名字，昵称、小名都可以</li>
          <li><strong>课堂照片</strong>：作品照片或上课过程照片，一张清晰的正面照片，光线充足即可（手机拍就行）</li>
          <li><strong>你的感受</strong>：剪这件作品时的心情、遇到的困难，或者想说的话</li>
        </ul>
      </section>
      <section class="about-section">
        <h2>内容维护</h2>
        <p>所有上线内容都由管理者统一整理，保证质量与秩序。</p>
        <p>维护流程：收集 → 审核 → 整理 → 上线</p>
        <p>更新一节课的内容，只需在对应课程文件夹里放入作品照片，在 info.json 中补充作者名字和感受，提交更新后网站自动上线。</p>
      </section>
      <section class="about-section">
        <h2>技术与成本</h2>
        <div class="tech-table">
          <div class="tech-row"><span class="tech-label">网站形态</span><span>纯静态网站（照片和文字都是文件，无需数据库）</span></div>
          <div class="tech-row"><span class="tech-label">托管</span><span>GitHub Pages（免费、免备案）</span></div>
          <div class="tech-row"><span class="tech-label">费用</span><span><strong>0 元</strong></span></div>
          <div class="tech-row"><span class="tech-label">更新方式</span><span>提交内容文件后自动重建上线</span></div>
          <div class="tech-row"><span class="tech-label">上传入口</span><span>网站在线表单（直接上传，无需注册）</span></div>
        </div>
        <p>网站本身只是一堆文件，没有服务器、没有数据库、没有按量计费服务，因此不存在"用超了要收费"或"不活动被暂停"的问题。</p>
      </section>
      <section class="about-section about-boundary">
        <h2>这个项目的边界</h2>
        <div class="boundary-grid">
          <div class="boundary-col can">
            <h3>做得到的</h3>
            <ul>
              <li>展示课程、教程、上课实录照片</li>
              <li>大家上传照片，老师审核后上线</li>
              <li>完全免费，长期稳定</li>
            </ul>
          </div>
          <div class="boundary-col cant">
            <h3>有意不做的</h3>
            <ul>
              <li>不开放"上传即显示"：所有内容都要经过审核</li>
              <li>不做公开评论区：保持安静</li>
              <li>不追求大而全：专注剪纸这一件事</li>
            </ul>
          </div>
        </div>
      </section>
    </div>`;
  return shell('关于我们', content);
}

function buildSubmit(courses) {
  const courseOptions = courses.map(c =>
    `<option value="${escapeHtml(c.title)}">${escapeHtml(c.title)}</option>`
  ).join('\n');

  const content = `
    <div class="submit-hero">
      <div class="container">
        <h1>提交课堂照片</h1>
        <p class="submit-sub">填写下面的表单，分享你的课堂照片和感受</p>
      </div>
    </div>
    <div class="container submit-body">
      <form class="submit-form" id="submitForm"
        action="https://formsubmit.co/2187416071@qq.com"
        method="POST" enctype="multipart/form-data">
        <input type="hidden" name="_subject" value="新课堂照片上传 - 剪纸小家">
        <input type="hidden" name="_captcha" value="false">
        <input type="hidden" name="_autoresponse" value="收到！感谢你的分享，老师会尽快审核并上线你的课堂照片。">
        <input type="hidden" name="_next" value="https://xix6267.github.io/H37-paper-cuttings/submit.html?success=1">

        <div class="form-group">
          <label for="name">你的名字 <span class="req">*</span></label>
          <input type="text" id="name" name="姓名" required placeholder="昵称、小名都可以">
        </div>

        <div class="form-group">
          <label for="course">哪一节课 <span class="req">*</span></label>
          <select id="course" name="课程" required>
            <option value="" disabled selected>请选择课程</option>
            ${courseOptions}
          </select>
        </div>

        <div class="form-group">
          <label for="thought">你的感受 <span class="req">*</span></label>
          <textarea id="thought" name="感受" rows="5" required
            placeholder="拍这张照片时的心情，或者想说的话..."></textarea>
        </div>

        <div class="form-group">
          <label for="photo">课堂照片（选填）</label>
          <input type="file" id="photo" name="attachment" accept="image/*">
          <p class="form-hint">作品照片或上课过程照片都可以，手机拍照即可</p>
        </div>

        <div class="form-group">
          <label for="contact">联系方式（选填）</label>
          <input type="text" id="contact" name="联系方式" placeholder="手机号或微信号，方便老师联系你">
        </div>

        <button type="submit" class="btn-submit btn-form">上传照片</button>
      </form>

      <div class="form-success" id="formSuccess" style="display:none">
        <div class="success-icon">✓</div>
        <h2>上传成功！</h2>
        <p>感谢你的分享，老师收到后会审核并上线你的作品。</p>
        <a href="index.html" class="btn-submit">返回首页</a>
      </div>
    </div>

    <script>
(function(){
  if (location.search.indexOf('success=1') > -1) {
    document.getElementById('submitForm').style.display = 'none';
    document.getElementById('formSuccess').style.display = 'block';
    history.replaceState(null, '', 'submit.html');
  }
  document.getElementById('submitForm').addEventListener('submit', function(e) {
    var btn = this.querySelector('.btn-form');
    btn.textContent = '上传中...';
    btn.disabled = true;
  });
})();
    </script>`;
  return shell('上传照片', content);
}

async function main() {
  console.log('Building 剪纸小家...');
  clean();
  const courses = loadCourses();
  console.log(`Found ${courses.length} courses`);
  copyDirSync(path.join(ROOT, 'content'), path.join(DIST, 'content'));
  fs.copyFileSync(path.join(ROOT, 'src', 'style.css'), path.join(DIST, 'style.css'));
  fs.writeFileSync(path.join(DIST, 'index.html'), buildIndex(courses));
  for (const course of courses) {
    const outDir = path.join(DIST, course.slug);
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, 'index.html'), buildCoursePage(course, courses));
  }
  fs.writeFileSync(path.join(DIST, 'about.html'), buildAbout());
  fs.writeFileSync(path.join(DIST, 'submit.html'), buildSubmit(courses));
  console.log('Build complete! Output in dist/');
}

main().catch(err => { console.error(err); process.exit(1); });
