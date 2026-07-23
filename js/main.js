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

  /* Dropdown menus: keep aria-expanded in sync, close on Escape / outside click */
  var drops = document.querySelectorAll(".nav-links li.has-drop");
  drops.forEach(function(li){
    var btn = li.querySelector(".drop-btn");
    var menu = li.querySelector(".drop-menu");
    if(!btn || !menu) return;
    btn.addEventListener("click", function(){
      var open = li.classList.toggle("force-open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    });
    menu.querySelectorAll("a").forEach(function(a){
      a.addEventListener("click", function(){
        li.classList.remove("force-open");
        btn.setAttribute("aria-expanded","false");
      });
    });
  });
  document.addEventListener("keydown", function(e){
    if(e.key !== "Escape") return;
    drops.forEach(function(li){
      li.classList.remove("force-open");
      var b = li.querySelector(".drop-btn");
      if(b) b.setAttribute("aria-expanded","false");
    });
  });
  document.addEventListener("click", function(e){
    drops.forEach(function(li){
      if(!li.contains(e.target)){
        li.classList.remove("force-open");
        var b = li.querySelector(".drop-btn");
        if(b) b.setAttribute("aria-expanded","false");
      }
    });
  });

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

  /* ============================================================
     Donate page widget
     Monthly / one-off toggle, amount selection, live impact line,
     and CTA that points at the correct hosted payment endpoint.
     Payments are handled by the PCI-compliant gateway (PayWay);
     this page never collects card details.
     ============================================================ */
  var widget = document.querySelector(".donate-widget");
  if(widget){
    var URL_MONTHLY = "https://www.payway.com.au/RegularSignUp?ClientNumber=Q31292&AddressRequired=false&CustomerNumber=&CustomerName=&FirstPaymentDate=";
    var URL_ONCE    = "https://www.payway.com.au/MakePayment?BillerCode=312926";

    var freqToggle = widget.querySelector(".freq-toggle");
    var freqBtns   = widget.querySelectorAll(".freq-btn");
    var amtBtns    = widget.querySelectorAll(".amt-btn");
    var custom     = widget.querySelector(".amt-custom input");
    var impactEl   = widget.querySelector(".dw-impact span:last-child");
    var cta        = widget.querySelector(".dw-cta");
    var altLink    = widget.querySelector(".dw-alt a");

    var state = { freq:"monthly", amount:50 };

    /* Framing copy: what a gift at this level helps make possible. */
    function impactFor(freq, amt){
      if(!amt || amt < 2){
        return "Every gift of $2 or more is tax-deductible and is allocated to a named research, education or patient-care project.";
      }
      if(freq === "monthly"){
        if(amt >= 200) return "A monthly gift of $" + amt + " helps sustain a clinical research assistant and keeps our trials moving, all year round.";
        if(amt >= 100) return "A monthly gift of $" + amt + " helps fund the patient samples and data that power our cancer registries.";
        if(amt >= 50)  return "A monthly gift of $" + amt + " helps train the next generation of upper GI surgeons through our fellowships.";
        return "A monthly gift of $" + amt + " provides steady, dependable support for the research teams working on the toughest cancers.";
      }
      if(amt >= 500) return "A gift of $" + amt + " can help fund a surgical fellow\u2019s training placement with the world\u2019s leading units.";
      if(amt >= 250) return "A gift of $" + amt + " can help equip a research project with the laboratory resources it needs.";
      if(amt >= 100) return "A gift of $" + amt + " can help support a patient through our recovery and rehabilitation programs.";
      if(amt >= 50)  return "A gift of $" + amt + " can help contribute to the clinical samples that drive early-detection research.";
      return "A gift of $" + amt + " goes straight to work on research, education and patient care for upper GI and HPB cancers.";
    }

    function render(){
      /* Toggle indicator + active states */
      freqToggle.setAttribute("data-freq", state.freq);
      freqBtns.forEach(function(b){
        b.classList.toggle("active", b.getAttribute("data-freq") === state.freq);
        b.setAttribute("aria-pressed", b.getAttribute("data-freq") === state.freq ? "true" : "false");
      });
      /* Amount buttons */
      amtBtns.forEach(function(b){
        b.classList.toggle("active", parseInt(b.getAttribute("data-amt"),10) === state.amount);
      });
      /* Impact line */
      if(impactEl){ impactEl.textContent = impactFor(state.freq, state.amount); }
      /* CTA endpoint + label */
      if(cta){
        cta.setAttribute("href", state.freq === "monthly" ? URL_MONTHLY : URL_ONCE);
        var label = cta.querySelector(".lbl");
        if(label){
          label.textContent = state.freq === "monthly"
            ? "Give $" + state.amount + " monthly"
            : "Give $" + state.amount + " once";
        }
      }
      /* Alternate link flips to the other option */
      if(altLink){
        if(state.freq === "monthly"){
          altLink.textContent = "Prefer a one-off gift?";
          altLink.setAttribute("data-freq", "once");
        } else {
          altLink.textContent = "Prefer to give monthly?";
          altLink.setAttribute("data-freq", "monthly");
        }
      }
    }

    freqBtns.forEach(function(b){
      b.addEventListener("click", function(){
        state.freq = b.getAttribute("data-freq");
        render();
      });
    });

    amtBtns.forEach(function(b){
      b.addEventListener("click", function(){
        state.amount = parseInt(b.getAttribute("data-amt"),10);
        if(custom){ custom.value = ""; }
        render();
      });
    });

    if(custom){
      custom.addEventListener("input", function(){
        var v = parseInt(custom.value.replace(/[^0-9]/g,""),10);
        state.amount = isNaN(v) ? 0 : v;
        amtBtns.forEach(function(b){ b.classList.remove("active"); });
        render();
      });
    }

    if(altLink){
      altLink.addEventListener("click", function(ev){
        ev.preventDefault();
        state.freq = altLink.getAttribute("data-freq");
        render();
        widget.scrollIntoView({behavior: reduced ? "auto" : "smooth", block:"center"});
      });
    }

    render();
  }
})();
