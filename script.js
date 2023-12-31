// Add interactive elements (optional)
const testimonials = [
    "Educatuma Academy helped me achieve my dream IELTS score!",
    "The personalized coaching was invaluable in my exam preparation.",
    "I highly recommend this institute to anyone looking to excel in their exams."
];

const testimonialIndex = 0;
const testimonialElement = document.querySelector(".testimonial");

setInterval(() => {
    testimonialElement.textContent = testimonials[testimonialIndex];
    testimonialIndex = (testimonialIndex + 1) % testimonials.length;
}, 5000); // Rotate testimonials every 5 seconds

// Add hover effects to the CTA button
const ctaButton = document.querySelector(".cta-button");

ctaButton.addEventListener("mouseover", () => {
    ctaButton.style.backgroundColor = "#ff0"; /* Brighter red on hover */
});

ctaButton.addEventListener("mouseout", () => {
    ctaButton.style.backgroundColor = "#f00"; /* Restore original red */
});
