// 样式更新
function updateStyle(stylecon, oldCulster, newCluster) {
  let newStyleCon = stylecon
  oldCulster.forEach((color, index) => {
    let regexp = ''
    if (color.split(',').length > 1) {
      const rgbArr = color.split(',')
      regexp = new RegExp(
        '\\s*' +
          rgbArr[0] +
          '\\s*,\\s*' +
          rgbArr[1] +
          '\\s*,\\s*' +
          rgbArr[2] +
          '\\s*',
        'ig'
      )
    } else {
      regexp = new RegExp(color, 'ig')
    }
    newStyleCon = newStyleCon.replace(regexp, newCluster[index])
  })
  return newStyleCon
}

// 得到需要修改的一系类颜色值
function getThemeCluster(theme) {
  const clusters = [theme]
  for (let i = 0; i <= 9; i++) {
    clusters.push(getTintColor(theme, Number(i / 10).toFixed(2)))
  }
  clusters.push(getShadeColor(theme, 0.1))
  return clusters
}

// 得到色调颜色
function getTintColor(color, tint) {
  let red = parseInt(color.slice(0, 2), 16)
  let green = parseInt(color.slice(2, 4), 16)
  let blue = parseInt(color.slice(4, 6), 16)

  if (tint === 0) {
    return [red, green, blue].join(',')
  } else {
    red += Math.round((255 - red) * tint)
    green += Math.round((255 - green) * tint)
    blue += Math.round((255 - blue) * tint)
    red = red.toString(16)
    green = green.toString(16)
    blue = blue.toString(16)
    return `#${red}${green}${blue}`
  }
}

// 获取阴影色调颜色
function getShadeColor(color, shade) {
  let red = parseInt(color.slice(0, 2), 16)
  let green = parseInt(color.slice(2, 4), 16)
  let blue = parseInt(color.slice(4, 6), 16)

  red = Math.round((1 - shade) * red)
  green = Math.round((1 - shade) * green)
  blue = Math.round((1 - shade) * blue)

  red = red.toString(16)
  green = green.toString(16)
  blue = blue.toString(16)
  return `#${red}${green}${blue}`
}

// 获取外链css文本内容
function getCSSText(url) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4 && xhr.status === 200) {
        let styleText = xhr.responseText.replace(/@font-face{[^}]+}/, '')
        styleText = formatUrlInStyle(styleText)
        resolve(styleText)
      }
    }
    xhr.open('GET', url)
    xhr.send()
  })
}

// 由于要通用style标签覆盖link标签引入的样式，需将link标签引入的样式中url()引入的资源./、../全部去除
function formatUrlInStyle(styleText) {
  // const urlReg = /(?<=url\().*?(?=\))/g
  // 此处代替上面注释的零宽断言正则表达式兼容safari浏览器
  const urlReg = /url\((.*?)\)/g
  let targetSrc = urlReg.exec(styleText)
  while (targetSrc) {
    const originSrc = targetSrc[1]
    targetSrc = urlReg.exec(styleText)
    if (/^(http|https):\/\//g.test(originSrc)) continue
    let formatSrc = originSrc
    const regexp = /^\.\.\//g
    while (regexp.test(formatSrc)) {
      formatSrc = formatSrc.replace(regexp, '')
    }
    styleText = styleText.replace(originSrc, formatSrc)
  }
  return styleText
}

// 获取外链CSS样式的url地址
function getRequestUrl(src) {
  if (/^(http|https):\/\//g.test(src)) {
    return src
  }
  let filePath = getFilePath()
  let count = 0
  const regexp = /\.\.\//g
  while (regexp.exec(src)) {
    count++
  }
  while (count--) {
    filePath = filePath.substring(0, filePath.lastIndexOf('/'))
  }
  return filePath + '/' + src.replace(/\.\.\//g, '')
}

// 获取当前window的url地址
function getFilePath() {
  const curHref = window.location.href
  if (curHref.indexOf('/#/') !== -1) {
    return curHref.substring(0, curHref.indexOf('/#/'))
  } else {
    return curHref.substring(0, curHref.lastIndexOf('/') + 1)
  }
}

/**
 * 修改主题色-head样式以及DOM行内样式
 * @param {string} newval 要设置的16进制颜色 必须为16进制
 * @param {string} oldval 之前主题色的16进制颜色 必须为16进制
 */
export default async function (newval, oldval) {
  if (typeof newval !== 'string' || newval === oldval) return
  const newThemeCluster = getThemeCluster(newval.replace('#', ''))
  const orignalCluster = getThemeCluster(oldval.replace('#', ''))
  // 获取原始值中包含rgb格式的值存为数组
  const rgbArr = orignalCluster[1].split(',')
  console.log('newThemeCluster', newThemeCluster);
  console.log('orignalCluster', orignalCluster);
  console.log('rgbArr', rgbArr);
  const orignalRGBRegExp = new RegExp(
    '\\(\\s*' +
      rgbArr[0] +
      '\\s*,\\s*' +
      rgbArr[1] +
      '\\s*,\\s*' +
      rgbArr[2] +
      '\\s*\\)',
    'i'
  )
  
  // 获取外链的样式内容并替换样式
  let styleTag = document.getElementById('new-configTheme__styles')
  const tagsDom = document.getElementsByTagName('link')
  if (!styleTag && tagsDom.length) {
    styleTag = document.createElement('style')
    styleTag.setAttribute('id', 'new-configTheme__styles')
    document.head.appendChild(styleTag)
    const tagsDomList = Array.prototype.slice.call(tagsDom)
    let innerTextCon = ''
    for (let i = 0; i < tagsDomList.length; i++) {
      const value = tagsDomList[i]
      const tagAttributeSrc = value.getAttribute('href')
      const requestUrl = getRequestUrl(tagAttributeSrc)
      const styleCon = await getCSSText(requestUrl)
      if (
        new RegExp(oldval, 'i').test(styleCon) ||
        orignalRGBRegExp.test(styleCon)
      ) {
        innerTextCon += updateStyle(
          styleCon,
          orignalCluster,
          newThemeCluster
        )
      }
    }
    styleTag.innerText = innerTextCon
  }

  // 获取页面的style标签
  const styles = [].slice
    .call(document.querySelectorAll('style'))
    .filter(style => {
      const text = style.innerText
      return new RegExp(oldval, 'i').test(text) || orignalRGBRegExp.test(text)
    })

  // 获取页面的style标签内容，使用updateStyle直接更新即可
  styles.forEach(style => {
    const { innerText } = style
    if (typeof innerText !== 'string') return
    style.innerText = updateStyle(
      innerText,
      orignalCluster,
      newThemeCluster
    )
  })

  // 获取DOM元素上的style
  const domAll = [].slice
    .call(document.getElementsByTagName('*'))
    .filter((dom, index) => {
      const stylCon = dom.getAttribute('style')
      return (
        stylCon &&
        (new RegExp(oldval, 'i').test(stylCon) ||
          orignalRGBRegExp.test(stylCon))
      )
    })
  domAll.forEach(dom => {
    const styleCon = dom.getAttribute('style')
    dom.style = updateStyle(styleCon, orignalCluster, newThemeCluster)
  })
}
