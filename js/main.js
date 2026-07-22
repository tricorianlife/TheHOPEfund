/* THE HOPE FUND - interactions (vanilla, no deps) */
(function(){
  "use strict";
  /* Flag JS availability so reveal/count-up styles only apply when JS runs.
     Without this class the page stays fully visible (no-JS resilience). */
  document.documentElement.classList.add("js");
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Header scroll state */
  var header = document.querySelector(".site-header");
  function onScroll(){
    if(window.scrollY > 40){ header.classList.add("scrolled"); }
    else { header.classList.remove("scrolled"); }
  }
  window.addEventListener("scroll", onScroll, {passive:true});
  onScroll();

  /* Mobile nav */
  var toggle = document.querySelector(".menu-toggle");
  var links = document.querySelector(".nav-links");
  if(toggle && links){
    toggle.addEventListener("click", function(){
      var open = links.classList.toggle("open");
      toggle.classList.toggle("open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      document.body.style.overflow = open ? "hidden" : "";
    });
    links.querySelectorAll("a").forEach(function(a){
      a.addEventListener("click", function(){
        links.classList.remove("open");
        toggle.classList.remove("open");
        toggle.setAttribute("aria-expanded","false");
        document.body.style.overflow = "";
      });
    });
  }

  /* Reveal on scroll */
  var reveals = document.querySelectorAll(".reveal");
  if(reduced || !("IntersectionObserver" in window)){
    reveals.forEach(function(el){ el.classList.add("in"); });
  } else {
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if(e.isIntersecting){ e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, {threshold:0.12, rootMargin:"0px 0px -40px 0px"});
    reveals.forEach(function(el){ io.observe(el); });
  }

  /* Animated counters */
  function animateCount(el){
    var target = parseFloat(el.getAttribute("data-count"));
    var suffix = el.getAttribute("data-suffix") || "";
    var dur = 1600, start = null;
    function step(ts){
      if(!start) start = ts;
      var p = Math.min((ts - start)/dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      var val = Math.round(target * eased);
      el.textContent = val.toLocaleString() + (p === 1 ? suffix : "");
      if(p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  var counters = document.querySelectorAll("[data-count]");
  if(reduced || !("IntersectionObserver" in window)){
    counters.forEach(function(el){
      el.textContent = parseFloat(el.getAttribute("data-count")).toLocaleString() + (el.getAttribute("data-suffix")||"");
    });
  } else {
    var cio = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if(e.isIntersecting){ animateCount(e.target); cio.unobserve(e.target); }
      });
    }, {threshold:0.12, rootMargin:"0px 0px -40px 0px"});
    counters.forEach(function(el){ cio.observe(el); });
  }

  /* Hero floating gold particles (kept light: 10, compositor-only) */
  var particles = document.querySelector(".particles");
  if(particles && !reduced){
    for(var i=0;i<10;i++){
      var s = document.createElement("i");
      s.style.left = (Math.random()*100) + "%";
      s.style.bottom = (Math.random()*30) + "%";
      s.style.animationDuration = (6 + Math.random()*8) + "s";
      s.style.animationDelay = (Math.random()*8) + "s";
      s.style.width = s.style.height = (3 + Math.random()*4) + "px";
      particles.appendChild(s);
    }
  }

  /* Pause hero ambient animations once the hero scrolls out of view (GPU). */
  var hero = document.querySelector(".hero");
  if(hero && !reduced && "IntersectionObserver" in window){
    var hio = new IntersectionObserver(function(entries){
      entries.forEach(function(e){ hero.classList.toggle("off", !e.isIntersecting); });
    }, {threshold:0});
    hio.observe(hero);
  }

  /* Contact form - opens the visitor's own email app (mailto).
     Nothing is stored on this website; the message is sent from their inbox. */
  var form = document.querySelector(".contact-form form, form.contact");
  if(form){
    form.addEventListener("submit", function(ev){
      ev.preventDefault();
      var name = (form.querySelector("#cf-name") || {}).value || "";
      var email = (form.querySelector("#cf-email") || {}).value || "";
      var msg = (form.querySelector("#cf-msg") || {}).value || "";
      var subject = encodeURIComponent("Website enquiry" + (name ? " from " + name : ""));
      var body = encodeURIComponent(msg + "\n\n" + (name ? "Name: " + name + "\n" : "") + (email ? "Email: " + email : ""));
      var note = document.querySelector(".form-note");
      if(note){ note.hidden = false; }
      window.location.href = "mailto:contact@thehopefund.org.au?subject=" + subject + "&body=" + body;
    });
  }

  /* Floating donate button */
  var fab = document.querySelector(".donate-fab");
  if(fab){
    var fabTick = function(){
      fab.classList.toggle("show", window.scrollY > window.innerHeight * 0.75);
    };
    window.addEventListener("scroll", fabTick, {passive:true});
    fabTick();
  }
})();
