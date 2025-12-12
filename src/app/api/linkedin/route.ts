import { NextRequest, NextResponse } from 'next/server';

// LinkedIn API integration
// For full integration, you'd need LinkedIn OAuth or a service like Proxycurl

export async function POST(request: NextRequest) {
  try {
    const { linkedin_url } = await request.json();

    if (!linkedin_url) {
      return NextResponse.json(
        { error: 'LinkedIn URL is required' },
        { status: 400 }
      );
    }

    // Validate LinkedIn URL format
    const linkedinRegex = /^https?:\/\/(www\.)?linkedin\.com\/in\/[\w-]+\/?$/;
    if (!linkedinRegex.test(linkedin_url)) {
      return NextResponse.json(
        { error: 'Invalid LinkedIn URL format' },
        { status: 400 }
      );
    }

    // Extract username from URL
    const username = linkedin_url.split('/in/')[1]?.replace('/', '');

    // Option 1: Use Proxycurl API (uncomment if you have an API key)
    // const PROXYCURL_API_KEY = process.env.PROXYCURL_API_KEY;
    // if (PROXYCURL_API_KEY) {
    //   const response = await fetch(
    //     `https://nubela.co/proxycurl/api/v2/linkedin?url=${encodeURIComponent(linkedin_url)}`,
    //     {
    //       headers: { Authorization: `Bearer ${PROXYCURL_API_KEY}` },
    //     }
    //   );
    //   if (response.ok) {
    //     const data = await response.json();
    //     return NextResponse.json({
    //       name: `${data.first_name} ${data.last_name}`,
    //       headline: data.headline,
    //       company: data.experiences?.[0]?.company,
    //       role: data.experiences?.[0]?.title,
    //       location: data.city,
    //       industry: data.industry,
    //       profile_pic: data.profile_pic_url,
    //     });
    //   }
    // }

    // Option 2: Return basic info (URL validation only)
    return NextResponse.json({
      linkedin_url,
      username,
      message: 'LinkedIn URL validated. For full profile data, configure Proxycurl or LinkedIn OAuth.',
    });
  } catch (err) {
    console.error('LinkedIn API error:', err);
    return NextResponse.json(
      { error: 'Failed to process LinkedIn URL' },
      { status: 500 }
    );
  }
}

// GET endpoint to initiate LinkedIn OAuth flow (optional)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (code) {
    // Handle OAuth callback
    // Exchange code for access token
    const clientId = process.env.LINKEDIN_CLIENT_ID;
    const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/linkedin`;

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: 'LinkedIn OAuth not configured' },
        { status: 500 }
      );
    }

    try {
      const tokenResponse = await fetch(
        'https://www.linkedin.com/oauth/v2/accessToken',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            code,
            redirect_uri: redirectUri,
            client_id: clientId,
            client_secret: clientSecret,
          }),
        }
      );

      const tokenData = await tokenResponse.json();

      if (tokenData.access_token) {
        // Fetch user profile with access token
        const profileResponse = await fetch(
          'https://api.linkedin.com/v2/me',
          {
            headers: {
              Authorization: `Bearer ${tokenData.access_token}`,
            },
          }
        );

        const profileData = await profileResponse.json();
        return NextResponse.json(profileData);
      }
    } catch (err) {
      console.error('OAuth error:', err);
    }
  }

  // Return OAuth URL for initiating login
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/linkedin`;
  const scope = 'r_liteprofile r_emailaddress';

  if (!clientId) {
    return NextResponse.json({
      error: 'LinkedIn OAuth not configured',
      message: 'Set LINKEDIN_CLIENT_ID in environment variables',
    });
  }

  const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}`;

  return NextResponse.json({ authUrl });
}
