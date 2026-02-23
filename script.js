const searchBtn = document.getElementById("searchBtn");
const searchInput = document.getElementById("searchInput");
const profileCard = document.getElementById("profileCard");
const themeToggle = document.getElementById("themeToggle");
const downloadBtn = document.getElementById("downloadPDF");
const loading = document.getElementById("loading");
const repoList = document.getElementById("repoList");
const recentContainer = document.getElementById("recentSearches");
const compareBtn = document.getElementById("compareBtn");
const compareInput = document.getElementById("compareInput");
const compareContainer = document.getElementById("compareContainer");

let chart;

// Event Listeners
searchBtn.addEventListener("click", () => {
    const username = searchInput.value.trim();
    if(username){
        fetchUser(username);
        saveRecent(username);
    }
});

// 👇 YAHAN ADD KARO
searchInput.addEventListener("keypress", e=>{
    if(e.key === "Enter"){
        searchBtn.click();
    }
});

async function fetchUser(username){
    loading.style.display="block";
    profileCard.style.display="none";

    const response = await fetch(`https://api.github.com/users/${username}`);
    if(!response.ok){
        alert("User not found");
        loading.style.display="none";
        return;
    }

    const data = await response.json();

    document.getElementById("avatar").src = data.avatar_url;
    document.getElementById("name").textContent = data.name || "No Name";
    document.getElementById("username").textContent = "@"+data.login;
    document.getElementById("repos").textContent = data.public_repos;
    document.getElementById("followers").textContent = data.followers;
    document.getElementById("following").textContent = data.following;

    await fetchRepos(username);

    loading.style.display="none";
    profileCard.style.display="block";
}

async function fetchRepos(username){
    const res = await fetch(`https://api.github.com/users/${username}/repos`);
    const repos = await res.json();

    const languageCount = {};
    repos.forEach(repo=>{
        if(repo.language){
            languageCount[repo.language] = (languageCount[repo.language]||0)+1;
        }
    });

    const labels = Object.keys(languageCount);
    const values = Object.values(languageCount);

    if(chart) chart.destroy();

    chart = new Chart(document.getElementById("languageChart"),{
        type:'doughnut',
        data:{
            labels:labels,
            datasets:[{data:values}]
        }
    });

    const topRepos = repos
        .sort((a,b)=>b.stargazers_count-a.stargazers_count)
        .slice(0,5);

    repoList.innerHTML="";

    topRepos.forEach(repo=>{
        const card = document.createElement("div");
        card.className="repo-card";
        card.innerHTML=`
            <h4>${repo.name}</h4>
            ⭐ ${repo.stargazers_count} | 🍴 ${repo.forks_count}
            <br>
            ${repo.language || ""}
            <br><br>
            <a href="${repo.html_url}" target="_blank">View Repo</a>
        `;
        repoList.appendChild(card);
    });
}

themeToggle.addEventListener("click",()=>{
    document.body.classList.toggle("light");
});

downloadBtn.addEventListener("click", async ()=>{
    const { jsPDF } = window.jspdf;
    const canvas = await html2canvas(profileCard);
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF();
    pdf.addImage(imgData,'PNG',10,10,180,0);
    pdf.save("profile.pdf");
});

function saveRecent(username){
    let searches = JSON.parse(localStorage.getItem("recent")) || [];
    if(!searches.includes(username)){
        searches.unshift(username);
        if(searches.length>5) searches.pop();
        localStorage.setItem("recent",JSON.stringify(searches));
    }
    displayRecent();
}

function displayRecent(){
    const searches = JSON.parse(localStorage.getItem("recent")) || [];
    recentContainer.innerHTML="";
    searches.forEach(user=>{
        const span=document.createElement("span");
        span.textContent=user;
        span.onclick=()=>fetchUser(user);
        recentContainer.appendChild(span);
    });
}

displayRecent();

compareBtn.addEventListener("click", async () => {
    const user1 = searchInput.value.trim();
    const user2 = compareInput.value.trim();

    if(!user1 || !user2){
        alert("Enter both usernames");
        return;
    }

    compareUsers(user1, user2);
});

async function compareUsers(user1, user2){

    compareContainer.innerHTML = "Loading...";

    const res1 = await fetch(`https://api.github.com/users/${user1}`);
    const res2 = await fetch(`https://api.github.com/users/${user2}`);

    if(!res1.ok || !res2.ok){
        compareContainer.innerHTML = "User not found";
        return;
    }

    const data1 = await res1.json();
    const data2 = await res2.json();

    compareContainer.innerHTML = `
        <div class="compare-card">
            <img src="${data1.avatar_url}" width="80" style="border-radius:50%">
            <h3>${data1.login}</h3>
            <p>Repos: ${data1.public_repos}</p>
            <p>Followers: ${data1.followers}</p>
            <p>Following: ${data1.following}</p>
        </div>

        <div class="compare-card">
            <img src="${data2.avatar_url}" width="80" style="border-radius:50%">
            <h3>${data2.login}</h3>
            <p>Repos: ${data2.public_repos}</p>
            <p>Followers: ${data2.followers}</p>
            <p>Following: ${data2.following}</p>
        </div>
    `;
}