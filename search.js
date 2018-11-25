const apiKey = 'AIzaSyDDx1dNsZzt1OYctCzbxXV-ti_bqW1qJ0w';
const youtubeLinkWithoutId = 'https://www.youtube.com/watch?v=';
const videoInYoutubeResponse = 15;
const resolutions = [1920, 1366, 960, 600, 0];
const videoOnPageVariants = [4, 3, 2, 1];
const bufferPagesIndex = 3;
const minLengthForSwipe = 100;
const listVideo = [];
const listVideoViewRate = {};
let currentAmountVideoOnPage = 1;
let offsetPage = 0;
let nextYoutubePageToken = null;
const body = document.querySelector('body');
const createDiv = () => document.createElement('div');
const createSection = () => document.createElement('section');
const videoContainer = () => document.querySelector('.video-list');
let section = createSection();

const main = document.createElement('main');
main.classList.add('main');
body.insertBefore(main, document.querySelector('script'));

// добавление строки поиска
const addSearchForm = () => {
  const header = document.createElement('header');
  header.classList.add('header');
  header.innerHTML = `<form class="search-form">
  <input class="query" type="text" placeholder="Искать здесь...">
  <button class="search" type="submit"></button>
  </form>`;
  body.insertBefore(header, body.firstChild);
};
addSearchForm();
const inputRequest = document.querySelector('.query');

// определение количества видео на странице
const defineVideoCount = () => {
  const width = window.innerWidth;
  let resultIndex = 0;
  for (let i = 0; i < resolutions.length; i += 1) {
    if (width >= resolutions[i]) {
      resultIndex = i;
      break;
    }
  }
  if (resultIndex > 0 && width !== resolutions[resultIndex]) {
    resultIndex -= 1;
  }
  currentAmountVideoOnPage = videoOnPageVariants[resultIndex];
  return currentAmountVideoOnPage;
};

// добавление контейнера для блоков видео
const createContainer = function createContainerForBlockVideo() {
  section = createSection();
  section.classList.add('video-list');
  main.appendChild(section);
};

// запрос статистики по конкретному видео
const getStatisticsVideo = function getStatisticByVideoIdFromYoutube(id) {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function reqest() {
      if (xhr.readyState === 4 && xhr.status === 200) {
        resolve(JSON.parse(xhr.response).items[0].statistics.viewCount);
      }
    };
    xhr.open('GET', `https://www.googleapis.com/youtube/v3/videos?id=${id}&key=${apiKey}&fields=items(statistics/viewCount)&part=statistics`, true);
    xhr.setRequestHeader('Accept', 'application/json;charset=UTF-8');
    xhr.send();
  });
};

// статистика по всем видео из лсита
const getListStatisticsVideo = function getStatisticAllVideoFromYoutube(list) {
  const promises = [];
  list.forEach((video) => {
    promises.push(getStatisticsVideo(video.id.videoId)
      .then((res) => {
        listVideoViewRate[video.id.videoId] = res;
      }));
  });
  return promises;
};

// получение первого листа
const getFirstYoutubePage = function getListVideoFromYoutube(resolve) {
  const xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function request() {
    if (xhr.readyState === 4 && xhr.status === 200) {
      JSON.parse(xhr.response).items.forEach(video => listVideo.push(video));
      nextYoutubePageToken = JSON.parse(xhr.response).nextPageToken;
      resolve(JSON.parse(xhr.response).items);
    }
  };
  xhr.open('GET', `https://www.googleapis.com/youtube/v3/search?key=${apiKey}&type=video&part=snippet&maxResults=${videoInYoutubeResponse}&q=${inputRequest.value}`, true);
  xhr.setRequestHeader('Accept', 'application/json;charset=UTF-8');
  xhr.send();
};

// создание пустого блока видео
const createBlockVideo = function createBlockVideoOnDocument() {
  const blockVideo = createDiv();
  blockVideo.classList.add('video');
  blockVideo.innerHTML = `<figure>
  <img class="thumbnails" src="" alt="">
  <figcaption><a class="title" href="">Title video</a></figcaption>
  <div class="author">
    <span>Author</span>
  </div>
  <div class="publication-date">
    <span>Date</span>
  </div>
  <div class="view-rate">
    <span>View Count</span>
  </div>
  <div class="description">
    <p>Description</p>
  </div>
  </figure>`;
  return blockVideo;
};

// добавление контента в блок
const addContentInBlock = function addAllContentInBlock(video, blockNumber) {
  const videoThumbnails = document.querySelectorAll('.thumbnails');
  const videoTitle = document.querySelectorAll('.title');
  const videoAuthor = document.querySelectorAll('.author span');
  const videoPublicationDate = document.querySelectorAll('.publication-date span');
  const videoViewRate = document.querySelectorAll('.view-rate span');
  const videoDescription = document.querySelectorAll('.description p');
  videoThumbnails[blockNumber].src = video.snippet.thumbnails.high.url;
  videoThumbnails[blockNumber].alt = video.snippet.title;
  videoTitle[blockNumber].innerText = video.snippet.title;
  videoTitle[blockNumber].href = youtubeLinkWithoutId.concat(video.id.videoId);
  videoAuthor[blockNumber].innerText = video.snippet.channelTitle;
  videoPublicationDate[blockNumber].innerText = video.snippet.publishedAt.match(/[0-9]+-[0-9]+-[0-9]+/);
  videoViewRate[blockNumber].innerText = listVideoViewRate[video.id.videoId];
  videoDescription[blockNumber].innerText = video.snippet.description;
};

// запросы на ютуб
const getContetntFromYoutube = function getVideoAndStatisticsFromYoutube(list) {
  return new Promise(list).then(getListStatisticsVideo);
};

// первоначальный вывод результатов поиска в блоки
const addContentOnPage = function addAllBlocksVideoOnPage() {
  for (let i = 0; i < currentAmountVideoOnPage; i += 1) {
    section.appendChild(createBlockVideo());
  }
  getContetntFromYoutube(getFirstYoutubePage).then((promises) => {
    for (let i = 0; i < currentAmountVideoOnPage; i += 1) {
      promises[i].then(() => addContentInBlock(listVideo[i], i));
    }
  });
};

// удаление старых блоков видео со страницы
const refreshContainer = function refreshVideoContainer() {
  if (videoContainer()) {
    videoContainer().remove();
  }
  defineVideoCount();
  createContainer();
};

// нажатие на кнопку поиска
const searchButton = document.querySelector('.search');
searchButton.addEventListener('click', (e) => {
  e.preventDefault();
  offsetPage = 0;
  listVideo.length = 0;
  refreshContainer();
  addContentOnPage();
});

// изменение кол-ва блоков видео от ширины брузера
const changeNumberVideoBlock = function changeNumberVideoBlockOnPage() {
  const tempCur = currentAmountVideoOnPage;
  const newAmountVideoOnPage = defineVideoCount();
  const dif = newAmountVideoOnPage - tempCur;
  if (dif <= 0) {
    for (let i = 0, len = Math.abs(dif); i < len; i += 1) section.lastChild.remove();
  } else {
    for (let i = 0; i < dif; i += 1) {
      section.appendChild(createBlockVideo());
      addContentInBlock(listVideo[tempCur + offsetPage + i], tempCur + i);
    }
  }
};
window.addEventListener('resize', changeNumberVideoBlock);

// создание блоков и заполнение контентом при листании страниц
const fillPrevNextPage = function addBlocksAndContentPrevNextPage() {
  for (let i = offsetPage; i < offsetPage + currentAmountVideoOnPage; i += 1) {
    section.appendChild(createBlockVideo());
    addContentInBlock(listVideo[i], i - offsetPage);
  }
};

// следующая страница ютуба
const addNextYoutubePage = function getAndAddNextYoutubePage(resolve) {
  const xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function reqest() {
    if (xhr.readyState === 4 && xhr.status === 200) {
      JSON.parse(xhr.response).items.forEach(video => listVideo.push(video));
      nextYoutubePageToken = JSON.parse(xhr.response).nextPageToken;
      resolve(JSON.parse(xhr.response).items);
    }
  };
  xhr.open('GET', `https://www.googleapis.com/youtube/v3/search?key=${apiKey}&type=video&part=snippet&maxResults=${videoInYoutubeResponse}&pageToken=${nextYoutubePageToken}&q=${inputRequest.value}`, true);
  xhr.setRequestHeader('Accept', 'application/json;charset=UTF-8');
  xhr.send();
};

// следующая страница из кэша
const nextPage = function getNextPage() {
  const remaringPages = listVideo.length - offsetPage - currentAmountVideoOnPage;
  if (remaringPages < currentAmountVideoOnPage * bufferPagesIndex) {
    getContetntFromYoutube(addNextYoutubePage);
  }
  refreshContainer();
  offsetPage += currentAmountVideoOnPage;
  fillPrevNextPage();
};

// предыдущая страница из кэша
const prevPage = function getPrevPage() {
  refreshContainer();
  offsetPage -= currentAmountVideoOnPage;
  fillPrevNextPage();
};

// действие при отпускании тача или мыши
let xDown = null;
const actionEnd = function mouseOrTouchEndAction(e) {
  if (document.getSelection().toString().length > 0) {
    return;
  }
  let xUp = null;
  if (e.type === 'mouseup') {
    xUp = e.clientX;
  } else if (e.type === 'touchend') {
    xUp = e.changedTouches[0].clientX;
  }
  const xDiff = xDown - xUp;
  if (Math.abs(xDiff) > minLengthForSwipe) {
    if (xDiff < 0) {
      if (offsetPage <= 0) {
        return;
      }
      videoContainer().classList.add('-swipe-right');
      setTimeout(prevPage, 500);
    } else {
      if (listVideo.length === 0) {
        return;
      }
      videoContainer().classList.add('-swipe-left');
      setTimeout(nextPage, 500);
    }
  }
  xDown = null;
};

// события по тач свайпу
main.addEventListener('touchstart', (e) => {
  xDown = e.touches[0].clientX;
});
main.addEventListener('touchend', actionEnd);

// события по мышь свайпу
main.addEventListener('mousedown', (e) => {
  xDown = e.clientX;
});
main.addEventListener('mouseup', actionEnd);

// события по нажатию на стрелки
window.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft') {
    prevPage();
  }
  if (e.key === 'ArrowRight') {
    nextPage();
  }
});
