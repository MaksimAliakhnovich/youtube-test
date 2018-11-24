const apiKey = 'AIzaSyDDx1dNsZzt1OYctCzbxXV-ti_bqW1qJ0w';
const youtubeLinkWithoutId = 'https://www.youtube.com/watch?v=';
const videoInYoutubeResponse = 15;
const resolutions = [1920, 1366, 960, 600, 0];
const videoOnPageVariants = [4, 3, 2, 1];
let currentAmountVideoOnPage = 1;
let offsetPage = 0;
const currentListVideo = [];
const listVideoViewRate = {};
const body = document.querySelector('body');
const createDiv = () => document.createElement('div');
const createSection = () => document.createElement('section');
let section = createSection();
const main = document.createElement('main');
main.classList.add('main');
body.insertBefore(main, document.querySelector('script'));
let nextPageToken = null;

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
    // if (width <= resolutions[i] && width > resolutions[i + 1]) {
    //   currentAmountVideoOnPage = videoOnPageVariants[i];
    //   break;
    // }
    // if (width > resolutions[i]) {
    //   currentAmountVideoOnPage = videoOnPageVariants[i];
    //   break;
    // }
    // if (width <= resolutions[videoOnPageVariants.length - 1]) {
    //   currentAmountVideoOnPage = videoOnPageVariants[videoOnPageVariants.length - 1];
    //   break;
    // }
    if (width >= resolutions[i]) {
      resultIndex = i;
      break;
    }
  }
  if (resultIndex > 0) {
    resultIndex--;
  }
  currentAmountVideoOnPage = videoOnPageVariants[resultIndex]

  console.log(currentAmountVideoOnPage);
  return currentAmountVideoOnPage;
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
  let promises = [];
  list.forEach((video) => {
    promises.push(getStatisticsVideo(video.id.videoId).then(res => { listVideoViewRate[video.id.videoId] = res; return res; }));
  });
  return promises;
};

// получение первого листа
const getListVideo = function getListVideoFromYoutube(resolve) {
  const xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function request() {
    if (xhr.readyState === 4 && xhr.status === 200) {
      JSON.parse(xhr.response).items.forEach(video => currentListVideo.push(video));
      resolve(JSON.parse(xhr.response).items);
      nextPageToken = JSON.parse(xhr.response).nextPageToken;
    }
  };
  xhr.open('GET', `https://www.googleapis.com/youtube/v3/search?key=${apiKey}&type=video&part=snippet&maxResults=${videoInYoutubeResponse}&q=${inputRequest.value}`, true);
  xhr.setRequestHeader('Accept', 'application/json;charset=UTF-8');
  xhr.send();
};

// добавление контента в блок
const addContentInBlock = function addAllContentInBlock(video, blockNumber) {
  const videoThumbnails = document.querySelectorAll('.thumbnails');
  const videoTitle = document.querySelectorAll('.title');
  const videoAuthor = document.querySelectorAll('.author');
  const videoPublicationDate = document.querySelectorAll('.publication-date');
  const videoViewRate = document.querySelectorAll('.view-rate');
  const videoDescription = document.querySelectorAll('.description p');
  videoThumbnails[blockNumber].src = video.snippet.thumbnails.high.url;
  videoTitle[blockNumber].innerText = video.snippet.title;
  videoTitle[blockNumber].href = youtubeLinkWithoutId.concat(video.id.videoId);
  videoAuthor[blockNumber].innerText = video.snippet.channelTitle;
  videoPublicationDate[blockNumber].innerText = video.snippet.publishedAt.match(/[0-9]+-[0-9]+-[0-9]+/);
  videoViewRate[blockNumber].innerText = listVideoViewRate[video.id.videoId];
  videoDescription[blockNumber].innerText = video.snippet.description;
};

// создание пустого блока видео
const createBlockVideo = function createBlockVideoOnDocument() {
  const blockVideo = createDiv();
  blockVideo.classList.add('video');
  blockVideo.innerHTML = `<figure>
  <img class="thumbnails" src="thumbnails.jpg" alt="">
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

// запросы на ютуб
const getContetntFromYoutube = function getVideoAndStatisticsFromYoutube() {
  return new Promise(
    getListVideo
  ).then(
    getListStatisticsVideo
  );
};

// добавление контейнера для блоков видео
const createContainer = function createContainerForBlockVideo() {
  section = createSection();
  section.classList.add('video-list');
  main.appendChild(section);
};

// вывод результатов поиска в блоки
const addContentOnPage = function addAllBlocksVideoOnPage() {
  for (let i = 0; i < currentAmountVideoOnPage; i += 1) {
    section.appendChild(createBlockVideo());
  }

  getContetntFromYoutube().then(promises => {
    for (let i = 0; i < currentAmountVideoOnPage; i += 1) {
      promises[i].then((x) => addContentInBlock(currentListVideo[i], i));
    }
  });

};

// нажатие на кнопку поиска
const searchButton = document.querySelector('.search');
searchButton.addEventListener('click', (e) => {
  e.preventDefault();
  offsetPage = 0;
  const oldVideoList = document.querySelector('.video-list');
  if (oldVideoList) {
    oldVideoList.remove();
  }
  defineVideoCount();
  createContainer();
  addContentOnPage();
});

function debounce(func, wait, immediate) {
  var timeout;
  return function () {
    var context = this, args = arguments;
    var later = function () {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };
    var callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(context, args);
  };
};

// изменение кол-ва блоков видео от ширины брузера
const changeNumberVideoBlock = function changeNumberVideoBlockOnPage() {
  const tempCur = currentAmountVideoOnPage;
  const newAmountVideoOnPage = defineVideoCount();
  var dif = newAmountVideoOnPage - tempCur;
  if (dif <= 0) {
    for (var i = 0, len = Math.abs(dif); i < len; i++) section.lastChild.remove();
  } else {
    for (var i = 0; i < dif; i++) {
      section.appendChild(createBlockVideo());
      addContentInBlock(currentListVideo[tempCur + offsetPage + i], tempCur + i);
    }
  }
};

const deb = debounce(changeNumberVideoBlock, 250);
window.addEventListener('resize', deb);

// следующая страница ютуба
const nextPageYoutube = function getNextPageYoutube() {
  const xhr = new XMLHttpRequest();
  xhr.onreadystatechange = function reqest() {
    if (xhr.readyState === 4 && xhr.status === 200) {
      JSON.parse(xhr.response).items.forEach(video => currentListVideo.push(video));
      console.log(currentListVideo);
      };
  };
  xhr.open('GET', `https://www.googleapis.com/youtube/v3/search?key=${apiKey}&type=video&part=snippet&maxResults=${videoInYoutubeResponse}&pageToken=${nextPageToken}&q=${inputRequest.value}`, true);
  xhr.setRequestHeader('Accept', 'application/json;charset=UTF-8');
  xhr.send();
};
const nextPageYoutubeButton = document.querySelector('.nextYoutube');
nextPageYoutubeButton.addEventListener('click', nextPageYoutube);

// предыдущая страница ютуба
// const prevPage = function getPrevPage() {
//   const xhr = new XMLHttpRequest();
//   xhr.onreadystatechange = function reqest() {
//     if (xhr.readyState === 4 && xhr.status === 200) {
//       currentListVideo = JSON.parse(xhr.response);
//       currentListVideo.map((video) => {
//         const div = main.appendChild(createDiv());
//         div.innerText = video.snippet.channelTitle;
//         return div;
//       });
//       console.log(currentListVideo);
//     }
//   };
//   xhr.open('GET', `https://www.googleapis.com/youtube/v3/search?key=${apiKey}&type=video&part=snippet&videoInYoutubeResponse=${videoInYoutubeResponse}&pageToken=${prevPageToken()}&q=${q()}`, true);
//   xhr.setRequestHeader('Accept', 'application/json;charset=UTF-8');
//   xhr.send();
// };
// const prevButton = document.querySelector('.prev');
// prevButton.addEventListener('click', prevPage);

const nextPage = function getNextPage(e) {
  e.preventDefault();
  const oldVideoList = document.querySelector('.video-list');
  if (oldVideoList) {
    oldVideoList.remove();
  }
  defineVideoCount();
  createContainer();
  offsetPage += currentAmountVideoOnPage;
  for (let index = offsetPage; index < offsetPage + currentAmountVideoOnPage; index++) {
    section.appendChild(createBlockVideo());
    addContentInBlock(currentListVideo[index], index - offsetPage)
  }
}
const nextButton = document.querySelector('.next');
nextButton.addEventListener('click', nextPage);

const prevPage = function getPrevPage(e) {
  e.preventDefault();
  const oldVideoList = document.querySelector('.video-list');
  if (oldVideoList) {
    oldVideoList.remove();
  }
  defineVideoCount();
  createContainer();
  offsetPage -= currentAmountVideoOnPage;
  for (let index = offsetPage; index < offsetPage + currentAmountVideoOnPage; index++) {
    section.appendChild(createBlockVideo());
    addContentInBlock(currentListVideo[index], index - offsetPage)
  }
}
const prevButton = document.querySelector('.prev');
prevButton.addEventListener('click', prevPage);
