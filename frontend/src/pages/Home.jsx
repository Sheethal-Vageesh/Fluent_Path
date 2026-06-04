import { Link } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { Button, Card, Container } from '../components/ui'

export function Home() {
  return (
    <AppShell>
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 indigo-50 to-transparent" />

        <Container>
          <div className="grid gap-8 py-6 lg:grid-cols-2 lg:items-center lg:py-10">

            {/* LEFT SECTION */}
            <div>
              <div className="inline-flex items-center rounded-full border border-indigo-100 bg-white px-3 py-1 text-xs font-semibold text-indigo-900">
                FluentPath
              </div>

              {/* English + Kannada Heading */}
              <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl leading-tight">
                Fluency Journey: Parent-Child Interaction Tracker
              </h1>

              <div className="mt-3 text-lg font-medium text-indigo-700 leading-relaxed">
                ನಿರರ್ಗಳ ಮಾತಿನ ಪಯಣ: ಪೋಷಕ–ಮಕ್ಕಳ ಸಂವಹನ ಪ್ರಗತಿ ಅನುಸರಣೆ 
             </div>

              {/* English Description */}
              <p className="mt-5 text-base leading-relaxed text-slate-600">
                A secure platform for clinicians and parents to collaborate on Parent–Child Interaction strategies for preschool children who stutter, with home practice tracking and progress monitoring.
              </p>

              {/* Kannada Description */}
              <p className="mt-3 text-base leading-relaxed text-slate-700">
                ತೊದಲುವಿಕೆ ಇರುವ ಪ್ರೀಸ್ಕೂಲ್ ಮಕ್ಕಳಿಗಾಗಿ ಪೋಷಕ–ಮಕ್ಕಳ ಪರಸ್ಪರ ಸಂವಹನ ತಂತ್ರಗಳಲ್ಲಿ ತಜ್ಞರು ಮತ್ತು ಪೋಷಕರು ಸಹಯೋಗದಿಂದ ಕಾರ್ಯನಿರ್ವಹಿಸಲು, ಮನೆಯಲ್ಲಿನ ಅಭ್ಯಾಸವನ್ನು ದಾಖಲಿಸಲು ಹಾಗೂ ಮಗುವಿನ ಪ್ರಗತಿಯನ್ನು ಗಮನಿಸಲು ಸಹಾಯ ಮಾಡುವ ಸುರಕ್ಷಿತ ವೇದಿಕೆ.
              </p>

              {/* Buttons */}
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link to="/get-started">
                  <Button className="w-full sm:w-auto">
                    Get Started / ಪ್ರಾರಂಭಿಸಿ
                  </Button>
                </Link>
              </div>

             
            </div>

            {/* RIGHT CARD */}
            <Card className="lg:ml-auto">
              <div className="text-left">

                {/* English Title */}
                <div className="text-sm font-semibold text-slate-900">
                  How FluentPath works
                </div>

                {/* Kannada Title */}
                <div className="mt-1 text-sm font-medium text-indigo-700">
                  ಫ್ಲ್ಯೂಎನ್ಟ್ ಪಾತ್ ಹೇಗೆ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತದೆ
                </div>

                <ol className="mt-4 list-decimal space-y-4 pl-5 text-sm text-slate-700">

                  <li>
                    <div className="font-medium">
                      Parents choose their clinician and send a request.
                    </div>
                    <div className="text-slate-500">
                      ಪೋಷಕರು ತಜ್ಞರನ್ನು ಆಯ್ಕೆ ಮಾಡಿ ವಿನಂತಿಯನ್ನು ಕಳುಹಿಸುತ್ತಾರೆ.
                    </div>
                  </li>

                  <li>
                    <div className="font-medium">
                      Clinician accepts request and assigns a Child ID.
                    </div>
                    <div className="text-slate-500">
                      ತಜ್ಞರು ವಿನಂತಿಯನ್ನು ಸ್ವೀಕರಿಸಿ ಮಗುವಿನ ಐಡಿ ನೀಡುತ್ತಾರೆ.
                    </div>
                  </li>

                  <li>
                    <div className="font-medium">
                      Clinician assigns parent-child interaction strategies.
                    </div>
                    <div className="text-slate-500">
                      ತಜ್ಞರು, ಪೋಷಕರು ಮತ್ತು ಮಕ್ಕಳ ಸಂವಹನ ತಂತ್ರಗಳನ್ನು ನೀಡುತ್ತಾರೆ.
                    </div>
                  </li>

                  <li>
                    <div className="font-medium">
                      Parents practise the strategies, indicate strategies implemented & duration of home training, submit the stuttering severity ratings, and upload the home training video (optional)
                    </div>
                    <div className="text-slate-500">
                      ಪೋಷಕರು ಈ ತಂತ್ರಗಳನ್ನು ಅಭ್ಯಾಸ ಮಾಡಬೇಕು, ಅಳವಡಿಸಿಕೊಂಡ ತಂತ್ರಗಳು ಮತ್ತು ಮನೆ ತರಬೇತಿಯ ಅವಧಿಯನ್ನು ನಮೂದಿಸಬೇಕು, ತೊದಲುವಿಕೆ ತೀವ್ರತೆಯ ರೇಟಿಂಗ್‌ಗಳನ್ನು (stutteringSeverity ratings) ಸಲ್ಲಿಸಬೇಕು ಮತ್ತು ಮನೆ ತರಬೇತಿಯ ವೀಡಿಯೊವನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಬೇಕು (ಇದು ಐಚ್ಛಿಕ) 
                    </div>
                  </li>

                </ol>
              </div>
            </Card>

          </div>
        </Container>
      </div>
    </AppShell>
  )
}


// import { Link } from 'react-router-dom'
// import { AppShell } from '../components/AppShell'
// import { Button, Card, Container } from '../components/ui'

// export function Home() {
//   return (
//     <AppShell>
//       <div className="relative overflow-hidden">
//         <div className="pointer-events-none absolute inset-0 indigo-gradient-to-b from-indigo-50 to-transparent" />
//         <Container>
//           <div className="grid gap-8 py-6 lg:grid-cols-2 lg:items-center lg:py-10">
//             <div>
//               <div className="inline-flex items-center rounded-full border border-indigo-200 bg-white px-3 py-1 text-xs font-semibold text-indigo-700">
//                 FluentPath
//               </div>
//               <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
//                 Track parent–child interaction strategies
//               </h1>
//               <p className="mt-4 text-base leading-relaxed text-slate-600">
//                 A secure workflow for clinicians and parents to coordinate preschool home strategies for children who
//                 stutter — with demos, practice tracking, and progress review.
//               </p>
//               <div className="mt-6 flex flex-col gap-2 sm:flex-row">
//                 <Link to="/get-started">
//                   <Button className="w-full sm:w-auto">Get started</Button>
//                 </Link>
//               </div>
//             </div>

//             <Card className="lg:ml-auto">
//               <div className="text-left">
//                 <div className="text-sm font-semibold text-slate-900">How FluentPath works</div>
//                 <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-slate-700">
//                   <li>Parents choose their clinician and send a request.</li>
//                   <li>Clinicians accept requests and assign a Child ID.</li>
//                   <li>Clinicians assign strategies with optional demo videos.</li>
//                   <li>Parents practise, submit ratings/durations, and optionally upload a practice video.</li>
//                 </ol>
//               </div>
//             </Card>
//           </div>
//         </Container>
//       </div>
//     </AppShell>
//   )
// }

